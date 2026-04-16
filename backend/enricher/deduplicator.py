"""TF-IDF job deduplicator.

Uses scikit-learn cosine similarity to detect near-duplicate job postings.
From IMPROVEMENTS.md §14a.
"""

from __future__ import annotations

import hashlib
import re
from typing import Sequence

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import structlog

log = structlog.get_logger(__name__)

# Jobs with cosine similarity above this threshold are considered duplicates
SIMILARITY_THRESHOLD = 0.85


def _normalise(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def make_dedup_key(title: str, company: str) -> str:
    """MD5 hash of normalised title+company — used as the fast exact-match key."""
    raw = f"{_normalise(title)}|{_normalise(company)}"
    return hashlib.md5(raw.encode()).hexdigest()


def find_duplicates(
    candidates: Sequence[dict],
    existing_keys: set[str] | None = None,
    threshold: float = SIMILARITY_THRESHOLD,
) -> tuple[list[dict], list[dict]]:
    """Split candidates into (unique, duplicates) using TF-IDF cosine similarity.

    Args:
        candidates:    List of job dicts with at least "title" and "company" keys.
        existing_keys: Set of dedup_keys already in the DB (exact-match fast path).
        threshold:     Cosine similarity above which two jobs are duplicates.

    Returns:
        (unique_jobs, duplicate_jobs)
    """
    if not candidates:
        return [], []

    existing_keys = existing_keys or set()
    unique: list[dict] = []
    duplicates: list[dict] = []

    # ── 1. Exact-match fast path ────────────────────────────────────────────
    after_exact: list[dict] = []
    for job in candidates:
        key = make_dedup_key(job.get("title", ""), job.get("company", ""))
        job["dedup_key"] = key
        if key in existing_keys:
            duplicates.append(job)
        else:
            after_exact.append(job)

    if len(after_exact) <= 1:
        unique.extend(after_exact)
        return unique, duplicates

    # ── 2. TF-IDF near-duplicate detection ─────────────────────────────────
    texts = [
        _normalise(f"{j.get('title', '')} {j.get('company', '')} {j.get('description', '')}")
        for j in after_exact
    ]

    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        tfidf_matrix = vectorizer.fit_transform(texts)
        sim_matrix = cosine_similarity(tfidf_matrix)
    except Exception as exc:
        log.warning("tfidf_failed", error=str(exc))
        unique.extend(after_exact)
        return unique, duplicates

    seen: set[int] = set()
    for i, job in enumerate(after_exact):
        if i in seen:
            duplicates.append(job)
            continue
        unique.append(job)
        for j in range(i + 1, len(after_exact)):
            if j not in seen and sim_matrix[i, j] >= threshold:
                seen.add(j)

    log.info(
        "dedup_done",
        total=len(candidates),
        unique=len(unique),
        dupes=len(duplicates),
    )
    return unique, duplicates
