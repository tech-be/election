"""optimize vote indexes

Revision ID: 20260425_000019
Revises: 20260425_000018
Create Date: 2026-04-25

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "20260425_000019"
down_revision: Union[str, None] = "20260425_000018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # For CSV export and time-ordered reads per campaign
    op.create_index(
        "ix_votes_campaign_id_created_at",
        "votes",
        ["campaign_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_votes_campaign_id_created_at", table_name="votes")

