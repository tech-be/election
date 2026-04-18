"""init campaigns

Revision ID: 20260409_000001
Revises: 
Create Date: 2026-04-09

"""

from alembic import op
import sqlalchemy as sa

revision = "20260409_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "campaigns",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("key_visual_url", sa.String(length=500), nullable=True),
        sa.Column("key_text", sa.Text(), nullable=True),
        sa.Column("products_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("thank_you_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("code", name="uq_campaigns_code"),
    )


def downgrade() -> None:
    op.drop_table("campaigns")
