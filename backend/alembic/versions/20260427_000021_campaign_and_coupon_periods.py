"""campaign and coupon periods

Revision ID: 20260427_000021
Revises: 20260426_000020
Create Date: 2026-04-27

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260427_000021"
down_revision: Union[str, None] = "20260426_000020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("campaigns", sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("coupons", sa.Column("issue_starts_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("coupons", sa.Column("use_ends_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("coupons", "use_ends_at")
    op.drop_column("coupons", "issue_starts_at")
    op.drop_column("campaigns", "ends_at")
    op.drop_column("campaigns", "starts_at")

