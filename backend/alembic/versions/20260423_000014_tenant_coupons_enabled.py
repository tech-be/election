"""tenants.coupons_enabled

Revision ID: 20260423_000014
Revises: 20260422_000013
Create Date: 2026-04-23

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260423_000014"
down_revision: Union[str, None] = "20260422_000013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column(
            "coupons_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("tenants", "coupons_enabled")
