"""rename default tenant 未分類 -> シスアド用

Revision ID: 20260503_000025
Revises: 20260502_000024
Create Date: 2026-05-03

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260503_000025"
down_revision: Union[str, None] = "20260502_000024"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("UPDATE tenants SET name = 'シスアド用' WHERE name = '未分類'"))


def downgrade() -> None:
    op.execute(sa.text("UPDATE tenants SET name = '未分類' WHERE name = 'シスアド用'"))
