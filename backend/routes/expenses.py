from datetime import date
from decimal import Decimal, InvalidOperation
import csv
import io

from flask import Blueprint, request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.expense import Expense
from models.category import ExpenseCategory
from utils.responses import success_response, error_response


expenses_bp = Blueprint(
    "expenses",
    __name__,
    url_prefix="/api/expenses"
)


def build_expense_query(user_id):
    """
    Build the base expense query for the authenticated user
    and optionally apply category and month filters.
    """

    query = Expense.query.filter_by(
        user_id=user_id
    )

    # Category filter
    category_id = request.args.get("category_id")

    if category_id is not None:
        try:
            category_id = int(category_id)
        except (TypeError, ValueError):
            return None, error_response(
                "Category ID must be a valid integer",
                400
            )

        query = query.filter(
            Expense.category_id == category_id
        )

    # Month filter
    month = request.args.get("month")

    if month is not None:
        try:
            year, month_number = month.split("-")

            year = int(year)
            month_number = int(month_number)

            if month_number < 1 or month_number > 12:
                raise ValueError

            start_date = date(
                year,
                month_number,
                1
            )

            if month_number == 12:
                end_date = date(
                    year + 1,
                    1,
                    1
                )
            else:
                end_date = date(
                    year,
                    month_number + 1,
                    1
                )

        except (ValueError, TypeError):
            return None, error_response(
                "Month must use YYYY-MM format, for example 2026-10",
                400
            )

        query = query.filter(
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        )

    return query, None


@expenses_bp.post("")
@jwt_required()
def create_expense():
    user_id = int(get_jwt_identity())

    data = request.get_json(silent=True)

    if not data:
        return error_response(
            "Request body must contain JSON data",
            400
        )

    category_id = data.get("category_id")
    amount = data.get("amount")
    description = data.get("description")
    expense_date = data.get("expense_date")

    if category_id is None:
        return error_response(
            "Category ID is required",
            400
        )

    if amount is None:
        return error_response(
            "Amount is required",
            400
        )

    if not expense_date:
        return error_response(
            "Expense date is required",
            400
        )

    category = db.session.get(
        ExpenseCategory,
        category_id
    )

    if not category:
        return error_response(
            "Category not found",
            404
        )

    # Validate monetary amount
    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, TypeError, ValueError):
        return error_response(
            "Amount must be a valid number",
            400
        )

    if amount <= 0:
        return error_response(
            "Amount must be greater than zero",
            400
        )

    if amount.as_tuple().exponent < -2:
        return error_response(
            "Amount cannot have more than two decimal places",
            400
        )

    # Validate expense date
    try:
        parsed_date = date.fromisoformat(expense_date)
    except (TypeError, ValueError):
        return error_response(
            "Expense date must use YYYY-MM-DD format",
            400
        )

    expense = Expense(
        user_id=user_id,
        category_id=category_id,
        amount=amount,
        description=description,
        expense_date=parsed_date
    )

    try:
        db.session.add(expense)
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to create expense",
            500
        )

    return success_response(
        "Expense created successfully",
        {
            "id": expense.id,
            "user_id": expense.user_id,
            "category_id": expense.category_id,
            "category": category.name,
            "amount": float(expense.amount),
            "description": expense.description,
            "expense_date": expense.expense_date.isoformat(),
            "created_at": expense.created_at.isoformat()
        },
        201
    )


@expenses_bp.get("")
@jwt_required()
def get_expenses():
    user_id = int(get_jwt_identity())

    query, error = build_expense_query(user_id)

    if error:
        return error

    expenses = query.order_by(
        Expense.expense_date.desc(),
        Expense.id.desc()
    ).all()

    data = [
        {
            "id": expense.id,
            "category_id": expense.category_id,
            "category": expense.category.name,
            "amount": float(expense.amount),
            "description": expense.description,
            "expense_date": expense.expense_date.isoformat(),
            "created_at": expense.created_at.isoformat()
        }
        for expense in expenses
    ]

    return success_response(
        "Expenses retrieved successfully",
        data
    )


@expenses_bp.get("/export")
@jwt_required()
def export_expenses():
    user_id = int(get_jwt_identity())

    query, error = build_expense_query(user_id)

    if error:
        return error

    expenses = query.order_by(
        Expense.expense_date.desc(),
        Expense.id.desc()
    ).all()

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "Category",
        "Amount",
        "Description",
        "Expense Date"
    ])

    for expense in expenses:
        writer.writerow([
            expense.id,
            expense.category.name,
            f"{float(expense.amount):.2f}",
            expense.description or "",
            expense.expense_date.isoformat()
        ])

    response = Response(
        output.getvalue(),
        mimetype="text/csv"
    )

    response.headers["Content-Disposition"] = (
        "attachment; filename=expenses.csv"
    )

    return response


@expenses_bp.get("/<int:expense_id>")
@jwt_required()
def get_expense(expense_id):
    user_id = int(get_jwt_identity())

    expense = Expense.query.filter_by(
        id=expense_id,
        user_id=user_id
    ).first()

    if not expense:
        return error_response(
            "Expense not found",
            404
        )

    return success_response(
        "Expense retrieved successfully",
        {
            "id": expense.id,
            "category_id": expense.category_id,
            "category": expense.category.name,
            "amount": float(expense.amount),
            "description": expense.description,
            "expense_date": expense.expense_date.isoformat(),
            "created_at": expense.created_at.isoformat()
        }
    )


@expenses_bp.put("/<int:expense_id>")
@jwt_required()
def update_expense(expense_id):
    user_id = int(get_jwt_identity())

    expense = Expense.query.filter_by(
        id=expense_id,
        user_id=user_id
    ).first()

    if not expense:
        return error_response(
            "Expense not found",
            404
        )

    data = request.get_json(silent=True)

    if not data:
        return error_response(
            "Request body must contain JSON data",
            400
        )

    category_id = data.get("category_id")
    amount = data.get("amount")
    description = data.get("description")
    expense_date = data.get("expense_date")

    # Update category
    if category_id is not None:
        category = db.session.get(
            ExpenseCategory,
            category_id
        )

        if not category:
            return error_response(
                "Category not found",
                404
            )

        expense.category_id = category_id

    # Update amount
    if amount is not None:
        try:
            amount = Decimal(str(amount))
        except (InvalidOperation, TypeError, ValueError):
            return error_response(
                "Amount must be a valid number",
                400
            )

        if amount <= 0:
            return error_response(
                "Amount must be greater than zero",
                400
            )

        if amount.as_tuple().exponent < -2:
            return error_response(
                "Amount cannot have more than two decimal places",
                400
            )

        expense.amount = amount

    # Update description
    if "description" in data:
        expense.description = description

    # Update expense date
    if expense_date is not None:
        try:
            parsed_date = date.fromisoformat(expense_date)
        except (TypeError, ValueError):
            return error_response(
                "Expense date must use YYYY-MM-DD format",
                400
            )

        expense.expense_date = parsed_date

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to update expense",
            500
        )

    category = db.session.get(
        ExpenseCategory,
        expense.category_id
    )

    return success_response(
        "Expense updated successfully",
        {
            "id": expense.id,
            "category_id": expense.category_id,
            "category": category.name,
            "amount": float(expense.amount),
            "description": expense.description,
            "expense_date": expense.expense_date.isoformat(),
            "created_at": expense.created_at.isoformat()
        }
    )


@expenses_bp.delete("/<int:expense_id>")
@jwt_required()
def delete_expense(expense_id):
    user_id = int(get_jwt_identity())

    expense = Expense.query.filter_by(
        id=expense_id,
        user_id=user_id
    ).first()

    if not expense:
        return error_response(
            "Expense not found",
            404
        )

    try:
        db.session.delete(expense)
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to delete expense",
            500
        )

    return success_response(
        "Expense deleted successfully"
    )