"""campaign vote confirm modal copy

Revision ID: 20260419_000010
Revises: 20260418_000009
Create Date: 2026-04-19

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260419_000010"
down_revision: Union[str, None] = "20260418_000009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "campaigns",
        sa.Column("vote_confirm_title", sa.String(length=200), nullable=True),
    )
    op.add_column(
        "campaigns",
        sa.Column("vote_confirm_body", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("campaigns", "vote_confirm_body")
    op.drop_column("campaigns", "vote_confirm_title")
