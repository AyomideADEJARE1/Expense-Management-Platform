from datetime import date

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from extensions import db
from models.expense import Expense
from models.category import ExpenseCategory
from utils.responses import success_response, error_response


summaries_bp = Blueprint(
    "summaries",
    __name__,
    url_prefix="/api/summaries"
)


@summaries_bp.get("/monthly")
@jwt_required()
def get_monthly_summary():
    user_id = int(get_jwt_identity())

    month = request.args.get("month")

    if not month:
        return error_response(
            "Month is required. Use YYYY-MM format",
            400
        )

    try:
        year, month_number = month.split("-")

        year = int(year)
        month_number = int(month_number)

        if month_number < 1 or month_number > 12:
            raise ValueError

        start_date = date(year, month_number, 1)

        if month_number == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_number + 1, 1)

    except (ValueError, TypeError):
        return error_response(
            "Month must use YYYY-MM format, for example 2026-10",
            400
        )

    total = db.session.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).scalar()

    return success_response(
        "Monthly summary retrieved successfully",
        {
            "month": month,
            "total_amount": float(total)
        }
    )


@summaries_bp.get("/category")
@jwt_required()
def get_category_summary():
    user_id = int(get_jwt_identity())

    month = request.args.get("month")

    if not month:
        return error_response(
            "Month is required. Use YYYY-MM format",
            400
        )

    try:
        year, month_number = month.split("-")

        year = int(year)
        month_number = int(month_number)

        if month_number < 1 or month_number > 12:
            raise ValueError

        start_date = date(year, month_number, 1)

        if month_number == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month_number + 1, 1)

    except (ValueError, TypeError):
        return error_response(
            "Month must use YYYY-MM format, for example 2026-10",
            400
        )

    results = db.session.query(
        ExpenseCategory.id,
        ExpenseCategory.name,
        func.coalesce(func.sum(Expense.amount), 0)
    ).join(
        Expense,
        Expense.category_id == ExpenseCategory.id
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).group_by(
        ExpenseCategory.id,
        ExpenseCategory.name
    ).order_by(
        func.sum(Expense.amount).desc()
    ).all()

    data = [
        {
            "category_id": category_id,
            "category": category_name,
            "total_amount": float(total_amount)
        }
        for category_id, category_name, total_amount in results
    ]

    return success_response(
        "Category summary retrieved successfully",
        data
    )
