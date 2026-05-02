"""tenant phone and address

Revision ID: 20260502_000024
Revises: 20260427_000023
Create Date: 2026-05-02

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260502_000024"
down_revision: Union[str, None] = "20260427_000023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("phone", sa.String(length=64), nullable=True))
    op.add_column("tenants", sa.Column("address", sa.String(length=2000), nullable=True))


def downgrade() -> None:
    op.drop_column("tenants", "address")
    op.drop_column("tenants", "phone")
