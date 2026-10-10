from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db, limiter
from models.user import User
from utils.responses import success_response, error_response


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.post("/register")
@limiter.limit("5 per minute")
def register():
    data = request.get_json(silent=True)

    if not data:
        return error_response(
            "Request body must contain JSON data",
            400
        )

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    if not full_name or not email or not password:
        return error_response(
            "Full name, email, and password are required",
            400
        )

    full_name = full_name.strip()
    email = email.strip().lower()

    if not full_name:
        return error_response(
            "Full name cannot be empty",
            400
        )

    if not email:
        return error_response(
            "Email cannot be empty",
            400
        )

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:
        return error_response(
            "A user with this email already exists",
            409
        )

    password_hash = generate_password_hash(password)

    user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash
    )

    try:
        db.session.add(user)
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Failed to register user",
            500
        )

    return success_response(
        "User registered successfully",
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        },
        201
    )


@auth_bp.post("/login")
@limiter.limit("5 per minute")
def login():
    data = request.get_json(silent=True)

    if not data:
        return error_response(
            "Request body must contain JSON data",
            400
        )

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return error_response(
            "Email and password are required",
            400
        )

    email = email.strip().lower()

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return error_response(
            "Invalid email or password",
            401
        )

    if not check_password_hash(
        user.password_hash,
        password
    ):
        return error_response(
            "Invalid email or password",
            401
        )

    access_token = create_access_token(
        identity=str(user.id)
    )

    return success_response(
        "Login successful",
        {
            "access_token": access_token,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email
            }
        }
    )


@auth_bp.get("/me")
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()

    user = db.session.get(
        User,
        user_id
    )

    if not user:
        return error_response(
            "User not found",
            404
        )

    return success_response(
        "Authenticated user",
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "currency": user.currency,
            "budget_threshold": user.budget_threshold,
            "notifications_enabled": user.notifications_enabled,
            "email_alerts_enabled": user.email_alerts_enabled
        }
    )

@auth_bp.put("/me")
@jwt_required()
def update_current_user():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return error_response("Request body must contain JSON data", 400)

    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        return error_response("User not found", 404)

    # Update the user's name when name fields are supplied.
    if "first_name" in data or "last_name" in data:
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()

        if not first_name:
            return error_response("First name cannot be empty", 400)

        full_name = f"{first_name} {last_name}".strip()

        if len(full_name) > 100:
            return error_response("Full name cannot exceed 100 characters", 400)

        user.full_name = full_name

    # Update and validate email.
    if "email" in data:
        email = data["email"]

        if not isinstance(email, str):
            return error_response("A valid email address is required", 400)

        email = email.strip().lower()

        if (
            not email
            or len(email) > 255
            or "@" not in email
            or "." not in email.rsplit("@", 1)[-1]
            or any(char.isspace() for char in email)
        ):
            return error_response("A valid email address is required", 400)

        existing_user = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()

        if existing_user:
            return error_response("A user with this email already exists", 409)

        user.email = email

    # Update and validate currency.
    if "currency" in data:
        allowed_currencies = {
            "NGN (₦)",
            "USD ($)",
            "EUR (€)",
            "GBP (£)"
        }

        if data["currency"] not in allowed_currencies:
            return error_response("Unsupported currency", 400)

        user.currency = data["currency"]

    # Update and validate the budget alert threshold.
    if "budget_threshold" in data:
        threshold = data["budget_threshold"]

        if (
            isinstance(threshold, bool)
            or not isinstance(threshold, int)
            or not 50 <= threshold <= 100
        ):
            return error_response(
                "Budget threshold must be an integer between 50 and 100",
                400
            )

        user.budget_threshold = threshold

    # Update notification preferences.
    for field in ("notifications_enabled", "email_alerts_enabled"):
        if field in data:
            if not isinstance(data[field], bool):
                return error_response(
                    f"{field} must be true or false",
                    400
                )

            setattr(user, field, data[field])

    user.updated_at = db.func.current_timestamp()

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return error_response("Failed to update profile", 500)

    name_parts = user.full_name.split(maxsplit=1)

    return success_response(
        "Profile updated successfully",
        {
            "id": user.id,
            "full_name": user.full_name,
            "first_name": name_parts[0],
            "last_name": name_parts[1] if len(name_parts) > 1 else "",
            "email": user.email,
            "currency": user.currency,
            "budget_threshold": user.budget_threshold,
            "notifications_enabled": user.notifications_enabled,
            "email_alerts_enabled": user.email_alerts_enabled
        }
    )
