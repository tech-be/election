"""campaign email_required and optional vote email

Revision ID: 20260426_000020
Revises: 20260425_000019
Create Date: 2026-04-26

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260426_000020"
down_revision: Union[str, None] = "20260425_000019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    campaigns_cols = {c["name"] for c in insp.get_columns("campaigns")}
    if "email_required" not in campaigns_cols:
        op.add_column(
            "campaigns",
            sa.Column("email_required", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
        op.alter_column("campaigns", "email_required", server_default=None)

    # votes.email: make nullable and enforce uniqueness only when email is present
    votes_cols = {c["name"] for c in insp.get_columns("votes")}
    votes_indexes = {ix["name"] for ix in insp.get_indexes("votes")}
    votes_uqs = {uq["name"] for uq in insp.get_unique_constraints("votes")}

    if "uq_votes_campaign_email" in votes_uqs:
        op.drop_constraint("uq_votes_campaign_email", "votes", type_="unique")

    if "email" in votes_cols:
        op.alter_column("votes", "email", existing_type=sa.String(length=254), nullable=True)

    if "ux_votes_campaign_email_present" not in votes_indexes:
        op.create_index(
            "ux_votes_campaign_email_present",
            "votes",
            ["campaign_id", "email"],
            unique=True,
            postgresql_where=sa.text("email IS NOT NULL"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    votes_indexes = {ix["name"] for ix in insp.get_indexes("votes")}
    votes_uqs = {uq["name"] for uq in insp.get_unique_constraints("votes")}
    if "ux_votes_campaign_email_present" in votes_indexes:
        op.drop_index("ux_votes_campaign_email_present", table_name="votes")
    op.alter_column("votes", "email", existing_type=sa.String(length=254), nullable=False)
    if "uq_votes_campaign_email" not in votes_uqs:
        op.create_unique_constraint("uq_votes_campaign_email", "votes", ["campaign_id", "email"])

    campaigns_cols = {c["name"] for c in insp.get_columns("campaigns")}
    if "email_required" in campaigns_cols:
        op.drop_column("campaigns", "email_required")

