from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError

from extensions import db
from models.category import ExpenseCategory
from models.budget import Budget
from models.expense import Expense
from utils.responses import success_response, error_response


categories_bp = Blueprint(
    "categories",
    __name__,
    url_prefix="/api/categories"
)


def _is_category_name_conflict(error):
    """Return True only for the database's category-name unique constraint."""
    diag = getattr(getattr(error, "orig", None), "diag", None)
    return (
        getattr(diag, "constraint_name", None)
        == "uq_expense_category_name"
    )


def _is_category_reference_conflict(error):
    """Return True for known foreign keys that prevent category deletion."""
    diag = getattr(getattr(error, "orig", None), "diag", None)
    return getattr(diag, "constraint_name", None) in {
        "fk_expenses_category",
        "fk_budgets_category",
    }


@categories_bp.get("")
def get_categories():
    categories = ExpenseCategory.query.order_by(
        ExpenseCategory.name.asc()
    ).all()

    data = [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description
        }
        for category in categories
    ]

    return success_response(
        "Categories retrieved successfully",
        data
    )


@categories_bp.post("")
@jwt_required()
def create_category():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return error_response(
            "Request body must contain JSON data",
            400
        )

    name = data.get("name")
    description = data.get("description")

    if not name:
        return error_response(
            "Category name is required",
            400
        )

    if not isinstance(name, str):
        return error_response(
            "Category name must be a string",
            400
        )

    if description is not None and not isinstance(description, str):
        return error_response(
            "Category description must be a string",
            400
        )

    name = name.strip()

    if not name:
        return error_response(
            "Category name cannot be empty",
            400
        )

    if len(name) > 100:
        return error_response(
            "Category name cannot exceed 100 characters",
            400
        )

    existing_category = ExpenseCategory.query.filter_by(
        name=name
    ).first()

    if existing_category:
        return error_response(
            "A category with this name already exists",
            409
        )

    category = ExpenseCategory(
        name=name,
        description=description
    )

    try:
        db.session.add(category)
        db.session.commit()
    except IntegrityError as error:
        db.session.rollback()

        if _is_category_name_conflict(error):
            return error_response(
                "A category with this name already exists",
                409
            )

        return error_response(
            "Failed to create category",
            500
        )
    except Exception:
        db.session.rollback()
        return error_response(
            "Failed to create category",
            500
        )

    return success_response(
        "Category created successfully",
        {
            "id": category.id,
            "name": category.name,
            "description": category.description
        },
        201
    )


@categories_bp.get("/<int:category_id>")
def get_category(category_id):
    category = db.session.get(
        ExpenseCategory,
        category_id
    )

    if not category:
        return error_response(
            "Category not found",
            404
        )

    return success_response(
        "Category retrieved successfully",
        {
            "id": category.id,
            "name": category.name,
            "description": category.description
        }
    )


@categories_bp.put("/<int:category_id>")
@jwt_required()
def update_category(category_id):
    category = db.session.get(
        ExpenseCategory,
        category_id
    )

    if not category:
        return error_response(
            "Category not found",
            404
        )

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return error_response(
            "Request body must contain JSON data",
            400
        )

    name = data.get("name")
    description = data.get("description")

    if name is not None:
        if not isinstance(name, str):
            return error_response(
                "Category name must be a string",
                400
            )

        name = name.strip()

        if not name:
            return error_response(
                "Category name cannot be empty",
                400
            )

        if len(name) > 100:
            return error_response(
                "Category name cannot exceed 100 characters",
                400
            )

        existing_category = ExpenseCategory.query.filter(
            ExpenseCategory.name == name,
            ExpenseCategory.id != category_id
        ).first()

        if existing_category:
            return error_response(
                "A category with this name already exists",
                409
            )

        category.name = name

    if description is not None:
        if not isinstance(description, str):
            return error_response(
                "Category description must be a string",
                400
            )

        category.description = description

    try:
        db.session.commit()
    except IntegrityError as error:
        db.session.rollback()

        if _is_category_name_conflict(error):
            return error_response(
                "A category with this name already exists",
                409
            )

        return error_response(
            "Failed to update category",
            500
        )
    except Exception:
        db.session.rollback()
        return error_response(
            "Failed to update category",
            500
        )

    return success_response(
        "Category updated successfully",
        {
            "id": category.id,
            "name": category.name,
            "description": category.description
        }
    )


@categories_bp.delete("/<int:category_id>")
@jwt_required()
def delete_category(category_id):
    category = db.session.get(
        ExpenseCategory,
        category_id
    )

    if not category:
        return error_response(
            "Category not found",
            404
        )

    if Expense.query.filter_by(category_id=category.id).first():
        return error_response(
            "Category cannot be deleted because it is being used by "
            "an expense",
            409
        )

    if Budget.query.filter_by(category_id=category.id).first():
        return error_response(
            "Category cannot be deleted because it is assigned to a budget",
            409
        )

    try:
        db.session.delete(category)
        db.session.commit()

    except IntegrityError as error:
        db.session.rollback()

        if _is_category_reference_conflict(error):
            return error_response(
                "Category cannot be deleted because it is referenced by "
                "an expense or budget",
                409
            )

        return error_response(
            "Failed to delete category",
            500
        )

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to delete category",
            500
        )

    return success_response(
        "Category deleted successfully"
    )
