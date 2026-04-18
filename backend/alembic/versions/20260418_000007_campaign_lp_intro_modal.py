"""campaign LP intro modal fields

Revision ID: 20260418_000007
Revises: 20260418_000006
Create Date: 2026-04-18

"""

from alembic import op
import sqlalchemy as sa

revision = "20260418_000007"
down_revision = "20260418_000006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("lp_intro_title", sa.String(length=200), nullable=True))
    op.add_column("campaigns", sa.Column("lp_intro_image_url", sa.String(length=500), nullable=True))
    op.add_column("campaigns", sa.Column("lp_intro_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("campaigns", "lp_intro_text")
    op.drop_column("campaigns", "lp_intro_image_url")
    op.drop_column("campaigns", "lp_intro_title")
