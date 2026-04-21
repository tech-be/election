"""coupons table

Revision ID: 20260420_000011
Revises: 20260419_000010
Create Date: 2026-04-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260420_000011"
down_revision: Union[str, None] = "20260419_000010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], name="fk_coupons_tenant_id"),
    )
    op.create_index("ix_coupons_tenant_id", "coupons", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_coupons_tenant_id", table_name="coupons")
    op.drop_table("coupons")
