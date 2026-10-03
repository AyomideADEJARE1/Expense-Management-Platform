import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_limiter.errors import RateLimitExceeded
from sqlalchemy.engine import URL

from extensions import db, limiter

from routes.auth import auth_bp
from routes.categories import categories_bp
from routes.expenses import expenses_bp
from routes.budgets import budgets_bp
from routes.summaries import summaries_bp


load_dotenv()


app = Flask(__name__)


app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")


database_url = URL.create(
    drivername="postgresql+psycopg",
    username=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host="localhost",
    port=5432,
    database=os.getenv("POSTGRES_DB"),
)


app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


db.init_app(app)

jwt = JWTManager(app)

limiter.init_app(app)


@jwt.unauthorized_loader
def handle_missing_token(error):
    return jsonify({
        "success": False,
        "message": "Authentication required",
        "data": None
    }), 401


@jwt.invalid_token_loader
def handle_invalid_token(error):
    return jsonify({
        "success": False,
        "message": "Invalid authentication token",
        "data": None
    }), 401


@jwt.expired_token_loader
def handle_expired_token(jwt_header, jwt_payload):
    return jsonify({
        "success": False,
        "message": "Authentication token has expired",
        "data": None
    }), 401


app.register_blueprint(auth_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(budgets_bp)
app.register_blueprint(summaries_bp)


@app.errorhandler(RateLimitExceeded)
def handle_rate_limit_error(error):
    return jsonify({
        "success": False,
        "message": "Too many requests. Please try again later.",
        "data": None
    }), 429


@app.get("/health")
def health():
    return jsonify({
        "status": "ok"
    })


@app.get("/health/db")
def database_health():
    try:
        db.session.execute(
            db.text("SELECT 1")
        )

        return jsonify({
            "status": "ok",
            "database": "connected"
        })

    except Exception:
        return jsonify({
            "status": "error",
            "database": "disconnected"
        }), 500


if __name__ == "__main__":
    app.run(debug=True)