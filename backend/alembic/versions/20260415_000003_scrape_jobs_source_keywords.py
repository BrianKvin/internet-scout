"""Add source_id and keywords to scrape_jobs.

Revision ID: 20260415_000003
Revises: 20260415_000002
Create Date: 2026-04-15 00:00:03
"""

from alembic import op
import sqlalchemy as sa


revision = "20260415_000003"
down_revision = "20260415_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("scrape_jobs", sa.Column("source_id", sa.String(), nullable=True))
    op.add_column("scrape_jobs", sa.Column("keywords", sa.JSON(), nullable=True))
    op.create_foreign_key(
        "fk_scrape_jobs_source_id_sources",
        "scrape_jobs",
        "sources",
        ["source_id"],
        ["id"],
    )
    op.create_index("ix_scrape_jobs_source_id", "scrape_jobs", ["source_id"])


def downgrade() -> None:
    op.drop_index("ix_scrape_jobs_source_id", table_name="scrape_jobs")
    op.drop_constraint("fk_scrape_jobs_source_id_sources", "scrape_jobs", type_="foreignkey")
    op.drop_column("scrape_jobs", "keywords")
    op.drop_column("scrape_jobs", "source_id")
