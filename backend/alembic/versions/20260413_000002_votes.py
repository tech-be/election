"""votes table

Revision ID: 20260413_000002
Revises: 20260409_000001
Create Date: 2026-04-13

"""

from alembic import op
import sqlalchemy as sa

revision = "20260413_000002"
down_revision = "20260409_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "votes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("campaign_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("product_indices_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], name="fk_votes_campaign_id"),
        sa.UniqueConstraint("campaign_id", "email", name="uq_votes_campaign_email"),
    )
    op.create_index("ix_votes_campaign_id", "votes", ["campaign_id"])


def downgrade() -> None:
    op.drop_index("ix_votes_campaign_id", table_name="votes")
    op.drop_table("votes")
