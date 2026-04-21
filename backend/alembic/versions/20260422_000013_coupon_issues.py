"""coupon_issues table (per-vote issued coupon tokens)

Revision ID: 20260422_000013
Revises: 20260421_000012
Create Date: 2026-04-22

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260422_000013"
down_revision: Union[str, None] = "20260421_000012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "coupon_issues",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("coupon_id", sa.Integer(), nullable=False),
        sa.Column("vote_id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["coupon_id"], ["coupons.id"], name="fk_coupon_issues_coupon_id"),
        sa.ForeignKeyConstraint(["vote_id"], ["votes.id"], name="fk_coupon_issues_vote_id"),
        sa.UniqueConstraint("vote_id", "coupon_id", name="uq_coupon_issues_vote_coupon"),
        sa.UniqueConstraint("token", name="uq_coupon_issues_token"),
    )
    op.create_index("ix_coupon_issues_coupon_id", "coupon_issues", ["coupon_id"])
    op.create_index("ix_coupon_issues_vote_id", "coupon_issues", ["vote_id"])


def downgrade() -> None:
    op.drop_index("ix_coupon_issues_vote_id", table_name="coupon_issues")
    op.drop_index("ix_coupon_issues_coupon_id", table_name="coupon_issues")
    op.drop_table("coupon_issues")
