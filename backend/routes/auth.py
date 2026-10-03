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
            "email": user.email
        }
    )
          