from extensions import db


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    category_id = db.Column(
        db.BigInteger,
        db.ForeignKey("expense_categories.id", ondelete="RESTRICT"),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    expense_date = db.Column(
        db.Date,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )

    # Relationships
    user = db.relationship(
        "User",
        back_populates="expenses"
    )

    category = db.relationship(
        "ExpenseCategory",
        back_populates="expenses"
    )
