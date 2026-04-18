"""campaign vote_max_products

Revision ID: 20260418_000008
Revises: 20260418_000007
Create Date: 2026-04-18

"""

from alembic import op
import sqlalchemy as sa

revision = "20260418_000008"
down_revision = "20260418_000007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "campaigns",
        sa.Column(
            "vote_max_products",
            sa.Integer(),
            nullable=False,
            server_default="3",
        ),
    )


def downgrade() -> None:
    op.drop_column("campaigns", "vote_max_products")
