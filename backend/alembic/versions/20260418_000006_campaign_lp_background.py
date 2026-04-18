"""campaign lp_background_key

Revision ID: 20260418_000006
Revises: 20260416_000005
Create Date: 2026-04-18

"""

from alembic import op
import sqlalchemy as sa

revision = "20260418_000006"
down_revision = "20260416_000005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "campaigns",
        sa.Column(
            "lp_background_key",
            sa.String(length=32),
            nullable=False,
            server_default="pastel_lavender",
        ),
    )


def downgrade() -> None:
    op.drop_column("campaigns", "lp_background_key")
