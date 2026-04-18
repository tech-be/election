"""campaign landing_url

Revision ID: 20260410_000003
Revises: 20260413_000002
Create Date: 2026-04-10

"""

from alembic import op
import sqlalchemy as sa

revision = "20260410_000003"
down_revision = "20260413_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("landing_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("campaigns", "landing_url")
