"""campaign no_landing_end_message

Revision ID: 20260418_000009
Revises: 20260418_000008
Create Date: 2026-04-18

"""

from alembic import op
import sqlalchemy as sa

revision = "20260418_000009"
down_revision = "20260418_000008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "campaigns",
        sa.Column("no_landing_end_message", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("campaigns", "no_landing_end_message")
