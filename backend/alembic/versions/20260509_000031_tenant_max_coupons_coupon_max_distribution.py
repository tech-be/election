"""tenant.max_coupons and coupons.max_distribution_count

Revision ID: 20260509_000031
Revises: 20260508_000030
Create Date: 2026-05-09

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260509_000031"
down_revision: Union[str, None] = "20260508_000030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column(
            "max_coupons",
            sa.Integer(),
            nullable=False,
            server_default="10",
        ),
    )
    op.alter_column("tenants", "max_coupons", server_default=None)
    op.add_column(
        "coupons",
        sa.Column(
            "max_distribution_count",
            sa.Integer(),
            nullable=False,
            server_default="10",
        ),
    )
    op.alter_column("coupons", "max_distribution_count", server_default=None)


def downgrade() -> None:
    op.drop_column("coupons", "max_distribution_count")
    op.drop_column("tenants", "max_coupons")
