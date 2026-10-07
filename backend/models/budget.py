from extensions import db


class Budget(db.Model):
    __tablename__ = "budgets"

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
        db.ForeignKey("expense_categories.id", ondelete="SET NULL"),
        nullable=True
    )

    amount = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    month = db.Column(
        db.Date,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp()
    )