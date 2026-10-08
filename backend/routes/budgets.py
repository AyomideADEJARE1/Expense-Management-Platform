from datetime import date
from decimal import Decimal, InvalidOperation

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.budget import Budget
from models.category import ExpenseCategory
from utils.responses import success_response, error_response


budgets_bp = Blueprint(
    "budgets",
    __name__,
    url_prefix="/api/budgets"
)


# ============================================================
# Create Budget
# ============================================================

@budgets_bp.post("")
@jwt_required()
def create_budget():
    user_id = int(get_jwt_identity())

    data = request.get_json(silent=True)

    if not data:
        return error_response(
            "Request body must contain JSON data",
            400
        )

    category_id = data.get("category_id")
    amount = data.get("amount")
    month = data.get("month")

    # --------------------------------------------------------
    # Validate required fields
    # --------------------------------------------------------

    if amount is None:
        return error_response(
            "Amount is required",
            400
        )

    if not month:
        return error_response(
            "Month is required",
            400
        )

    # --------------------------------------------------------
    # Validate category if provided
    # --------------------------------------------------------

    category = None

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

    # --------------------------------------------------------
    # Validate amount
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Validate month
    # --------------------------------------------------------

    try:
        parsed_month = date.fromisoformat(month)

    except (TypeError, ValueError):
        return error_response(
            "Month must use YYYY-MM-DD format",
            400
        )

    if parsed_month.day != 1:
        return error_response(
            "Month must be the first day of the month, for example "
            "2026-10-01",
            400
        )

    # --------------------------------------------------------
    # Check for existing budget
    # --------------------------------------------------------

    existing_query = Budget.query.filter_by(
        user_id=user_id,
        month=parsed_month
    )

    if category_id is None:
        existing_budget = existing_query.filter(
            Budget.category_id.is_(None)
        ).first()

    else:
        existing_budget = existing_query.filter_by(
            category_id=category_id
        ).first()

    if existing_budget:
        return error_response(
            "A budget already exists for this month and category",
            409
        )

    # --------------------------------------------------------
    # Create budget
    # --------------------------------------------------------

    budget = Budget(
        user_id=user_id,
        category_id=category_id,
        amount=amount,
        month=parsed_month
    )

    try:
        db.session.add(budget)
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to create budget",
            500
        )

    # --------------------------------------------------------
    # Return created budget
    # --------------------------------------------------------

    return success_response(
        "Budget created successfully",
        {
            "id": budget.id,
            "category_id": budget.category_id,
            "category": category.name if category else None,
            "amount": float(budget.amount),
            "month": budget.month.isoformat(),
            "created_at": budget.created_at.isoformat()
        },
        201
    )


# ============================================================
# Get Current User's Budgets
# ============================================================

@budgets_bp.get("")
@jwt_required()
def get_budgets():
    user_id = int(get_jwt_identity())

    budgets = Budget.query.filter_by(
        user_id=user_id
    ).order_by(
        Budget.month.desc(),
        Budget.id.desc()
    ).all()

    data = []

    for budget in budgets:
        category = None

        if budget.category_id is not None:
            category = db.session.get(
                ExpenseCategory,
                budget.category_id
            )

        data.append({
            "id": budget.id,
            "category_id": budget.category_id,
            "category": category.name if category else None,
            "amount": float(budget.amount),
            "month": budget.month.isoformat(),
            "created_at": budget.created_at.isoformat()
        })

    return success_response(
        "Budgets retrieved successfully",
        data
    )


# ============================================================
# Get One Budget
# ============================================================

@budgets_bp.get("/<int:budget_id>")
@jwt_required()
def get_budget(budget_id):
    user_id = int(get_jwt_identity())

    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=user_id
    ).first()

    if not budget:
        return error_response(
            "Budget not found",
            404
        )

    category = None

    if budget.category_id is not None:
        category = db.session.get(
            ExpenseCategory,
            budget.category_id
        )

    return success_response(
        "Budget retrieved successfully",
        {
            "id": budget.id,
            "category_id": budget.category_id,
            "category": category.name if category else None,
            "amount": float(budget.amount),
            "month": budget.month.isoformat(),
            "created_at": budget.created_at.isoformat()
        }
    )


# ============================================================
# Update Budget
# ============================================================

@budgets_bp.put("/<int:budget_id>")
@jwt_required()
def update_budget(budget_id):
    user_id = int(get_jwt_identity())

    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=user_id
    ).first()

    if not budget:
        return error_response(
            "Budget not found",
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
    month = data.get("month")

    # --------------------------------------------------------
    # Update category
    # --------------------------------------------------------

    if "category_id" in data:

        category = None

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

        budget.category_id = category_id

    # --------------------------------------------------------
    # Update amount
    # --------------------------------------------------------

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

        budget.amount = amount

    # --------------------------------------------------------
    # Update month
    # --------------------------------------------------------

    if month is not None:

        try:
            parsed_month = date.fromisoformat(month)

        except (TypeError, ValueError):
            return error_response(
                "Month must use YYYY-MM-DD format",
                400
            )

        if parsed_month.day != 1:
            return error_response(
                "Month must be the first day of the month, for example "
                "2026-10-01",
                400
            )

        budget.month = parsed_month

    # --------------------------------------------------------
    # Check for duplicate budget
    # --------------------------------------------------------

    duplicate_query = Budget.query.filter(
        Budget.user_id == user_id,
        Budget.id != budget.id,
        Budget.month == budget.month
    )

    if budget.category_id is None:
        duplicate_budget = duplicate_query.filter(
            Budget.category_id.is_(None)
        ).first()

    else:
        duplicate_budget = duplicate_query.filter(
            Budget.category_id == budget.category_id
        ).first()

    if duplicate_budget:
        db.session.rollback()

        return error_response(
            "A budget already exists for this month and category",
            409
        )

    # --------------------------------------------------------
    # Save changes
    # --------------------------------------------------------

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to update budget",
            500
        )

    # --------------------------------------------------------
    # Get updated category
    # --------------------------------------------------------

    category = None

    if budget.category_id is not None:
        category = db.session.get(
            ExpenseCategory,
            budget.category_id
        )

    # --------------------------------------------------------
    # Return updated budget
    # --------------------------------------------------------

    return success_response(
        "Budget updated successfully",
        {
            "id": budget.id,
            "category_id": budget.category_id,
            "category": category.name if category else None,
            "amount": float(budget.amount),
            "month": budget.month.isoformat(),
            "created_at": budget.created_at.isoformat()
        }
    )


# ============================================================
# Delete Budget
# ============================================================

@budgets_bp.delete("/<int:budget_id>")
@jwt_required()
def delete_budget(budget_id):
    user_id = int(get_jwt_identity())

    budget = Budget.query.filter_by(
        id=budget_id,
        user_id=user_id
    ).first()

    if not budget:
        return error_response(
            "Budget not found",
            404
        )

    try:
        db.session.delete(budget)
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to delete budget",
            500
        )

    return success_response(
        "Budget deleted successfully"
    )
