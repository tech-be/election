"""campaign kinds master and campaigns.campaign_kind_id

Revision ID: 20260506_000028
Revises: 20260505_000027
Create Date: 2026-05-06

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260506_000028"
down_revision: Union[str, None] = "20260505_000027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "campaign_kinds",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
    )
    op.create_index("ix_campaign_kinds_name", "campaign_kinds", ["name"], unique=True)

    op.execute(sa.text("INSERT INTO campaign_kinds (name) VALUES ('人気投票')"))

    op.add_column("campaigns", sa.Column("campaign_kind_id", sa.Integer(), nullable=True))
    op.execute(
        sa.text(
            "UPDATE campaigns SET campaign_kind_id = (SELECT id FROM campaign_kinds ORDER BY id ASC LIMIT 1)"
        )
    )
    op.alter_column("campaigns", "campaign_kind_id", nullable=False)
    op.create_index("ix_campaigns_campaign_kind_id", "campaigns", ["campaign_kind_id"], unique=False)
    op.create_foreign_key(
        "fk_campaigns_campaign_kind_id_campaign_kinds",
        "campaigns",
        "campaign_kinds",
        ["campaign_kind_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_campaigns_campaign_kind_id_campaign_kinds", "campaigns", type_="foreignkey")
    op.drop_index("ix_campaigns_campaign_kind_id", table_name="campaigns")
    op.drop_column("campaigns", "campaign_kind_id")
    op.drop_index("ix_campaign_kinds_name", table_name="campaign_kinds")
    op.drop_table("campaign_kinds")
