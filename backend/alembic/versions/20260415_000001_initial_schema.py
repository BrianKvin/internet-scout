"""Initial schema.

Revision ID: 20260415_000001
Revises: 
Create Date: 2026-04-15 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260415_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sources",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("strategy", sa.String(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_scraped", sa.DateTime(), nullable=True),
        sa.Column("job_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("health", sa.String(), nullable=False, server_default=sa.text("'ok'")),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    op.create_table(
        "collections",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("item_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "companies",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("domain", sa.String(), nullable=True),
        sa.Column("website", sa.Text(), nullable=True),
        sa.Column("careers_url", sa.Text(), nullable=True),
        sa.Column("source_id", sa.String(), sa.ForeignKey("sources.id"), nullable=True),
        sa.Column("sector", sa.String(), nullable=True),
        sa.Column("stage", sa.String(), nullable=True),
        sa.Column("headcount", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("enriched", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("enriched_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("company_id", sa.String(), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("source_id", sa.String(), sa.ForeignKey("sources.id"), nullable=True),
        sa.Column("dedup_key", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("salary", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("apply_url", sa.Text(), nullable=False),
        sa.Column("sector", sa.String(), nullable=True),
        sa.Column("stage", sa.String(), nullable=True),
        sa.Column("tags", sa.String(), nullable=True),
        sa.Column("is_new", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_remote", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("saved_at", sa.DateTime(), nullable=True),
        sa.Column("scraped_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("dedup_key"),
    )

    op.create_table(
        "signals",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("company_id", sa.String(), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("amount", sa.String(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("detected_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "scrape_jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column("collection_id", sa.String(), sa.ForeignKey("collections.id"), nullable=True),
        sa.Column("schedule", sa.String(), nullable=False, server_default=sa.text("'manual'")),
        sa.Column("notify", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("last_run", sa.DateTime(), nullable=True),
        sa.Column("last_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("health", sa.String(), nullable=False, server_default=sa.text("'ok'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "pipeline_items",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("job_id", sa.String(), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("stage", sa.String(), nullable=False, server_default=sa.text("'discovered'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("applied_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "pipeline_steps",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("scrape_job_id", sa.String(), sa.ForeignKey("scrape_jobs.id"), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("config", sa.JSON(), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.create_table(
        "collection_items",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("collection_id", sa.String(), sa.ForeignKey("collections.id"), nullable=False),
        sa.Column("scrape_job_id", sa.String(), sa.ForeignKey("scrape_jobs.id"), nullable=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("dedup_key", sa.String(), nullable=True),
        sa.Column("is_new", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("scraped_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("dedup_key"),
    )

    op.create_table(
        "scrape_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("source_id", sa.String(), sa.ForeignKey("sources.id"), nullable=True),
        sa.Column("scrape_job_id", sa.String(), sa.ForeignKey("scrape_jobs.id"), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("items_found", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("items_new", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("items_deduped", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("duration_ms", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
    )

    op.create_index("ix_collection_items_collection_id", "collection_items", ["collection_id"])
    op.create_index("ix_collection_items_dedup_key", "collection_items", ["dedup_key"])
    op.create_index("ix_jobs_source_id", "jobs", ["source_id"])
    op.create_index("ix_companies_source_id", "companies", ["source_id"])
    op.create_index("ix_scrape_runs_source_id", "scrape_runs", ["source_id"])
    op.create_index("ix_scrape_runs_scrape_job_id", "scrape_runs", ["scrape_job_id"])


def downgrade() -> None:
    op.drop_index("ix_scrape_runs_scrape_job_id", table_name="scrape_runs")
    op.drop_index("ix_scrape_runs_source_id", table_name="scrape_runs")
    op.drop_index("ix_companies_source_id", table_name="companies")
    op.drop_index("ix_jobs_source_id", table_name="jobs")
    op.drop_index("ix_collection_items_dedup_key", table_name="collection_items")
    op.drop_index("ix_collection_items_collection_id", table_name="collection_items")

    op.drop_table("scrape_runs")
    op.drop_table("collection_items")
    op.drop_table("pipeline_steps")
    op.drop_table("pipeline_items")
    op.drop_table("scrape_jobs")
    op.drop_table("signals")
    op.drop_table("jobs")
    op.drop_table("companies")
    op.drop_table("collections")
    op.drop_table("sources")
