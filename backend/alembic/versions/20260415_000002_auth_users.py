"""Add users table for authentication.

Revision ID: 20260415_000002
Revises: 20260415_000001
Create Date: 2026-04-15 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260415_000002"
down_revision = "20260415_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("email"),
    )


def downgrade() -> None:
    op.drop_table("users")
