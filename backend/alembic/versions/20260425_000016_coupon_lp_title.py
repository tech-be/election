"""coupons.lp_title for public coupon LP heading

Revision ID: 20260425_000016
Revises: 20260424_000015
Create Date: 2026-04-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260425_000016"
down_revision: Union[str, None] = "20260424_000015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("coupons", sa.Column("lp_title", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("coupons", "lp_title")
