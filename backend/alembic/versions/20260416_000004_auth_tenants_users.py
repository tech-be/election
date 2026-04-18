"""auth tenants/users/session tokens

Revision ID: 20260416_000004
Revises: 20260410_000003
Create Date: 2026-04-16

"""

from alembic import op
import sqlalchemy as sa

revision = "20260416_000004"
down_revision = "20260410_000003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=500), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], name="fk_users_tenant_id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    op.create_table(
        "session_tokens",
        sa.Column("token", sa.String(length=64), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_session_tokens_user_id"),
    )
    op.create_index("ix_session_tokens_user_id", "session_tokens", ["user_id"])

    op.add_column("campaigns", sa.Column("tenant_id", sa.Integer(), nullable=True))
    op.create_index("ix_campaigns_tenant_id", "campaigns", ["tenant_id"])
    op.create_foreign_key("fk_campaigns_tenant_id", "campaigns", "tenants", ["tenant_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_campaigns_tenant_id", "campaigns", type_="foreignkey")
    op.drop_index("ix_campaigns_tenant_id", table_name="campaigns")
    op.drop_column("campaigns", "tenant_id")

    op.drop_index("ix_session_tokens_user_id", table_name="session_tokens")
    op.drop_table("session_tokens")

    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_table("tenants")

