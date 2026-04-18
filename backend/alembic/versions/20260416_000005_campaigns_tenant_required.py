"""campaigns tenant_id required

Revision ID: 20260416_000005
Revises: 20260416_000004
Create Date: 2026-04-16

"""

from alembic import op
import sqlalchemy as sa

revision = "20260416_000005"
down_revision = "20260416_000004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    r = conn.execute(sa.text("SELECT COUNT(*) FROM tenants")).scalar()
    if r == 0:
        conn.execute(
            sa.text(
                "INSERT INTO tenants (name, created_at, updated_at) "
                "VALUES ('未分類', now(), now())"
            )
        )
    conn.execute(
        sa.text(
            "UPDATE campaigns SET tenant_id = (SELECT id FROM tenants ORDER BY id LIMIT 1) "
            "WHERE tenant_id IS NULL"
        )
    )
    op.alter_column("campaigns", "tenant_id", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    op.alter_column("campaigns", "tenant_id", existing_type=sa.Integer(), nullable=True)
