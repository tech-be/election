"""admin_operation_logs.api_name (backend handler name)

Revision ID: 20260507_000029
Revises: 20260506_000028
Create Date: 2026-05-07

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260507_000029"
down_revision: Union[str, None] = "20260506_000028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admin_operation_logs",
        sa.Column("api_name", sa.String(length=128), nullable=True),
    )
    op.create_index("ix_admin_operation_logs_api_name", "admin_operation_logs", ["api_name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_admin_operation_logs_api_name", table_name="admin_operation_logs")
    op.drop_column("admin_operation_logs", "api_name")
