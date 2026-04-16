"""Pipeline executor.

Runs an ordered chain of pipeline steps for a ScrapeJob.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from models.scrape_job import PipelineStep
from pipeline.steps import enrich_step, deduplicate_step, export_step, notify_step, webhook_step
import structlog

log = structlog.get_logger(__name__)

# Maps PipelineStep.type → step module
STEP_MAP = {
    "enrich": enrich_step,
    "deduplicate": deduplicate_step,
    "export": export_step,
    "notify": notify_step,
    "webhook": webhook_step,
}


async def run_pipeline(
    db: AsyncSession,
    steps: list[PipelineStep],
    context: dict,
) -> list[dict]:
    """Execute each enabled step in order, passing accumulated context.

    Args:
        db:      Async DB session.
        steps:   Ordered list of PipelineStep ORM objects.
        context: Initial context dict (e.g. new_count, source_name).

    Returns:
        List of result dicts, one per step executed.
    """
    results = []
    ctx = dict(context)

    for step in sorted(steps, key=lambda s: s.order_index):
        if not step.enabled:
            log.debug("pipeline_step_skipped", type=step.type, step_id=step.id)
            continue

        step_module = STEP_MAP.get(step.type)
        if step_module is None:
            log.warning("pipeline_unknown_step_type", type=step.type)
            continue

        config: dict = step.config or {}
        try:
            log.info("pipeline_step_start", type=step.type, step_id=step.id)
            result = await step_module.run(db=db, config=config, **ctx)
            ctx.update(result)  # pass outputs forward as context
            results.append({"step": step.type, "result": result})
            log.info("pipeline_step_done", type=step.type, result=result)
        except Exception as exc:
            log.error("pipeline_step_failed", type=step.type, error=str(exc))
            results.append({"step": step.type, "error": str(exc)})

    return results
