from flask import Blueprint, request

from extensions import db
from models.category import ExpenseCategory
from utils.responses import success_response, error_response


categories_bp = Blueprint(
    "categories",
    __name__,
    url_prefix="/api/categories"
)


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
def create_category():
    data = request.get_json(silent=True)

    if not data:
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

    name = name.strip()

    if not name:
        return error_response(
            "Category name cannot be empty",
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

    db.session.add(category)
    db.session.commit()

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

    if not data:
        return error_response(
            "Request body must contain JSON data",
            400
        )

    name = data.get("name")
    description = data.get("description")

    if name is not None:
        name = name.strip()

        if not name:
            return error_response(
                "Category name cannot be empty",
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
        category.description = description

    db.session.commit()

    return success_response(
        "Category updated successfully",
        {
            "id": category.id,
            "name": category.name,
            "description": category.description
        }
    )


@categories_bp.delete("/<int:category_id>")
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

    try:
        db.session.delete(category)
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Category cannot be deleted because it is being used by "
            "an expense",
            409
        )

    return success_response(
        "Category deleted successfully"
    )
