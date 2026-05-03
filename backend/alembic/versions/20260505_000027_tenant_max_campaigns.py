"""tenant max_campaigns

Revision ID: 20260505_000027
Revises: 20260504_000026
Create Date: 2026-05-05

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260505_000027"
down_revision: Union[str, None] = "20260504_000026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("max_campaigns", sa.Integer(), nullable=False, server_default="3"),
    )
    op.alter_column("tenants", "max_campaigns", server_default=None)


def downgrade() -> None:
    op.drop_column("tenants", "max_campaigns")
