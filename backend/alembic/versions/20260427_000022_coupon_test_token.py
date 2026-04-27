"""coupon test token

Revision ID: 20260427_000022
Revises: 20260427_000021
Create Date: 2026-04-27

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260427_000022"
down_revision: Union[str, None] = "20260427_000021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("coupons", sa.Column("test_token", sa.String(length=64), nullable=True))
    op.create_index("ix_coupons_test_token", "coupons", ["test_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_coupons_test_token", table_name="coupons")
    op.drop_column("coupons", "test_token")

