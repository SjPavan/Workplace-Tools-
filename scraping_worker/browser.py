"""Browser utilities wrapping Playwright with stealth and retry logic."""

from __future__ import annotations

import asyncio
import random
from contextlib import asynccontextmanager
from typing import AsyncIterator, Optional

from playwright.async_api import Browser, BrowserContext, Page, async_playwright
from tenacity import AsyncRetrying, RetryError, retry_if_exception_type, stop_after_attempt, wait_exponential

from .config import WorkerConfig
from .stealth import apply_stealth


class NavigationError(RuntimeError):
    """Raised when navigation repeatedly fails."""


class BrowserSession:
    """Manage a Playwright Chromium session with stealth and rotating user agents."""

    def __init__(self, config: WorkerConfig) -> None:
        self._config = config

    @asynccontextmanager
    async def page(self, user_agent: Optional[str] = None) -> AsyncIterator[Page]:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=self._config.headless)
            try:
                context = await self._create_context(browser, user_agent=user_agent)
                page = await context.new_page()
                try:
                    yield page
                finally:
                    await context.close()
            finally:
                await browser.close()

    async def _create_context(self, browser: Browser, user_agent: Optional[str]) -> BrowserContext:
        ua = user_agent or random.choice(self._config.user_agents)
        context = await browser.new_context(user_agent=ua)
        context.set_default_navigation_timeout(self._config.navigation_timeout_ms)
        context.set_default_timeout(self._config.request_timeout_ms)
        await apply_stealth(context)
        return context

    async def navigate(self, page: Page, url: str, wait_for_selector: Optional[str] = None) -> None:
        retryer = AsyncRetrying(
            stop=stop_after_attempt(self._config.max_retries),
            wait=wait_exponential(
                multiplier=self._config.base_backoff_seconds,
                min=self._config.base_backoff_seconds,
                max=self._config.base_backoff_seconds * (self._config.backoff_factor ** self._config.max_retries),
            ),
            retry=retry_if_exception_type(Exception),
            reraise=True,
        )
        try:
            async for attempt in retryer:
                with attempt:
                    await page.goto(url, wait_until="networkidle")
                    if wait_for_selector:
                        await page.wait_for_selector(wait_for_selector)
        except RetryError as exc:
            raise NavigationError(str(exc)) from exc


async def run_custom_scripts(page: Page, scripts: list[str]) -> None:
    """Evaluate custom scripts sequentially against the page."""

    for script in scripts:
        await page.add_script_tag(content=script)
        await asyncio.sleep(0)
