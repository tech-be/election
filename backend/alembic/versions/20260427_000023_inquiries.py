"""inquiries

Revision ID: 20260427_000023
Revises: 20260427_000022
Create Date: 2026-04-27

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260427_000023"
down_revision: Union[str, None] = "20260427_000022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "inquiries",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_inquiries_email", "inquiries", ["email"], unique=False)
    op.create_index("ix_inquiries_created_at", "inquiries", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_inquiries_created_at", table_name="inquiries")
    op.drop_index("ix_inquiries_email", table_name="inquiries")
    op.drop_table("inquiries")

