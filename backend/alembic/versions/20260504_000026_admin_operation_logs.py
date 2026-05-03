"""admin operation logs

Revision ID: 20260504_000026
Revises: 20260503_000025
Create Date: 2026-05-04

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260504_000026"
down_revision: Union[str, None] = "20260503_000025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_operation_logs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("screen", sa.String(length=300), nullable=False),
        sa.Column("operation", sa.String(length=200), nullable=False),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_admin_operation_logs_user_id", "admin_operation_logs", ["user_id"], unique=False)
    op.create_index("ix_admin_operation_logs_screen", "admin_operation_logs", ["screen"], unique=False)
    op.create_index("ix_admin_operation_logs_operation", "admin_operation_logs", ["operation"], unique=False)
    op.create_index("ix_admin_operation_logs_created_at", "admin_operation_logs", ["created_at"], unique=False)
    op.create_foreign_key(
        "fk_admin_operation_logs_user_id_users",
        "admin_operation_logs",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_admin_operation_logs_user_id_users", "admin_operation_logs", type_="foreignkey")
    op.drop_index("ix_admin_operation_logs_created_at", table_name="admin_operation_logs")
    op.drop_index("ix_admin_operation_logs_operation", table_name="admin_operation_logs")
    op.drop_index("ix_admin_operation_logs_screen", table_name="admin_operation_logs")
    op.drop_index("ix_admin_operation_logs_user_id", table_name="admin_operation_logs")
    op.drop_table("admin_operation_logs")
