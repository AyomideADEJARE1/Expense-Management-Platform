from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(255),
        nullable=False,
        unique=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )

    currency = db.Column(
        db.String(20),
        nullable=False,
        default="NGN (₦)",
        server_default="NGN (₦)"
    )

    budget_threshold = db.Column(
        db.Integer,
        nullable=False,
        default=85,
        server_default="85"
    )

    notifications_enabled = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=db.true()
    )

    email_alerts_enabled = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=db.true()
    )

    # Relationships
    expenses = db.relationship(
        "Expense",
        back_populates="user",
        cascade="all, delete-orphan"
    )
