"""Persistent Playwright browser pool with stealth and resource blocking.

Reuses a single Chromium instance across scrapes. Each scrape gets an
isolated BrowserContext (separate cookies, storage) that is cleaned up
after use.
"""

from __future__ import annotations

import structlog

log = structlog.get_logger(__name__)

_playwright_instance = None
_browser = None

_BLOCKED_RESOURCE_TYPES = {"image", "font", "stylesheet", "media"}


async def _block_resources(route):
    """Abort requests for images, fonts, CSS, and media to speed up loads."""
    if route.request.resource_type in _BLOCKED_RESOURCE_TYPES:
        await route.abort()
    else:
        await route.continue_()


async def get_browser():
    """Return a shared Chromium browser instance, launching if needed."""
    global _playwright_instance, _browser

    if _browser and _browser.is_connected():
        return _browser

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log.error("playwright_not_installed")
        raise RuntimeError("playwright is not installed — run: pip install playwright && playwright install chromium")

    _playwright_instance = await async_playwright().start()
    _browser = await _playwright_instance.chromium.launch(headless=True)
    log.info("browser_launched")
    return _browser


async def render_page(url: str, *, timeout: int = 60_000) -> str:
    """Render a JS page and return the final HTML.

    Uses a fresh BrowserContext per call (isolated cookies/storage),
    blocks unnecessary resources, and applies basic stealth patches.
    """
    browser = await get_browser()
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    )

    try:
        page = await context.new_page()

        # Apply stealth patches if available
        try:
            from playwright_stealth import stealth_async
            await stealth_async(page)
        except ImportError:
            pass  # stealth not installed — proceed without

        # Block heavy resources
        await page.route("**/*", _block_resources)

        await page.goto(url, wait_until="networkidle", timeout=timeout)
        return await page.content()
    except Exception as exc:
        log.error("render_page_failed", url=url, error=str(exc))
        return ""
    finally:
        await context.close()


async def close_browser() -> None:
    """Shut down the shared browser and Playwright instance."""
    global _playwright_instance, _browser
    if _browser:
        await _browser.close()
        _browser = None
    if _playwright_instance:
        await _playwright_instance.stop()
        _playwright_instance = None
