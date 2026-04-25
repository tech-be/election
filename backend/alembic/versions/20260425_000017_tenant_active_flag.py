"""tenants.active flag for disabling tenant login

Revision ID: 20260425_000017
Revises: 20260425_000016
Create Date: 2026-04-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260425_000017"
down_revision: Union[str, None] = "20260425_000016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("tenants", "active", server_default=None)


def downgrade() -> None:
    op.drop_column("tenants", "active")

