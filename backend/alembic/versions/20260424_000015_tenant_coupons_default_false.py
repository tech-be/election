"""tenants.coupons_enabled server default false (was true in first revision)

Revision ID: 20260424_000015
Revises: 20260423_000014
Create Date: 2026-04-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260424_000015"
down_revision: Union[str, None] = "20260423_000014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "tenants",
        "coupons_enabled",
        server_default=sa.text("false"),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "tenants",
        "coupons_enabled",
        server_default=sa.text("true"),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )
