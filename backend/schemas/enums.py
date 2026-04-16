"""Shared enums — single source of truth for constrained string fields."""

from enum import Enum


class SourceType(str, Enum):
    JOB_BOARD = "job_board"
    VC_PORTFOLIO = "vc_portfolio"
    GOVERNMENT = "government"
    NEWS = "news"
    DIRECTORY = "directory"
    REGULATORY = "regulatory"
    ENVIRONMENT = "environment"
    RESEARCH = "research"
    CUSTOM = "custom"


class SourceStrategy(str, Enum):
    YC = "yc"
    GENERIC_JOBS = "generic_jobs"
    GENERIC_PORTFOLIO = "generic_portfolio"
    PLAYWRIGHT_PORTFOLIO = "playwright_portfolio"
    HN_HIRING = "hn_hiring"
    GENERIC_TABLE = "generic_table"
    GENERIC_LIST = "generic_list"
    RSS_FEED = "rss_feed"
    PDF_EXTRACT = "pdf_extract"
    PLAYWRIGHT_SPA = "playwright_spa"
    API_JSON = "api_json"


class SourceHealth(str, Enum):
    OK = "ok"
    WARNING = "warning"
    DEAD = "dead"


class ScrapeRunStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class Schedule(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MANUAL = "manual"


class PipelineStage(str, Enum):
    DISCOVERED = "discovered"
    RESEARCHED = "researched"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"


class SignalType(str, Enum):
    FUNDING_ROUND = "funding_round"
    NEWS = "news"
    HIRING_SURGE = "hiring_surge"
    REGULATORY_CHANGE = "regulatory_change"
    ENVIRONMENTAL_ALERT = "environmental_alert"
    TENDER_DEADLINE = "tender_deadline"


class PipelineStepType(str, Enum):
    ENRICH = "enrich"
    DEDUPLICATE = "deduplicate"
    EXPORT = "export"
    NOTIFY = "notify"
    WEBHOOK = "webhook"
