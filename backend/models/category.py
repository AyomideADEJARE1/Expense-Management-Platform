from extensions import db


class ExpenseCategory(db.Model):
    __tablename__ = "expense_categories"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    name = db.Column(
        db.String(100),
        nullable=False,
        unique=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )

    # Relationships
    expenses = db.relationship(
        "Expense",
        back_populates="category"
    )