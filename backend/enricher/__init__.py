"""Enricher package."""

from .careers_finder import find_careers_url
from .email_finder import guess_patterns
from .deduplicator import find_duplicates, make_dedup_key

__all__ = [
    "find_careers_url",
    "guess_patterns",
    "find_duplicates",
    "make_dedup_key",
]
