"""coupon campaign_id FK

Revision ID: 20260421_000012
Revises: 20260420_000011
Create Date: 2026-04-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260421_000012"
down_revision: Union[str, None] = "20260420_000011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("coupons", sa.Column("campaign_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_coupons_campaign_id",
        "coupons",
        "campaigns",
        ["campaign_id"],
        ["id"],
    )
    op.create_index("ix_coupons_campaign_id", "coupons", ["campaign_id"])


def downgrade() -> None:
    op.drop_index("ix_coupons_campaign_id", table_name="coupons")
    op.drop_constraint("fk_coupons_campaign_id", "coupons", type_="foreignkey")
    op.drop_column("coupons", "campaign_id")
