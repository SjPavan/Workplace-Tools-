"""Page extractors turning DOM content into structured datasets."""

from __future__ import annotations

from typing import Any, Dict, List

from playwright.async_api import Page

from .jobs import ExtractionType, ScrapingJob


async def extract_records(page: Page, job: ScrapingJob) -> List[Dict[str, Any]]:
    """Dispatch to the appropriate extractor according to the job definition."""

    if job.extraction_type is ExtractionType.TABLE:
        selector = job.selectors.get("table") or job.selectors.get("root")
        return await _extract_table(page, selector)
    if job.extraction_type is ExtractionType.ARTICLE:
        selector = job.selectors.get("article") or job.selectors.get("root")
        record = await _extract_article(page, selector)
        return [record] if record else []
    if job.extraction_type is ExtractionType.PRODUCT:
        return await _extract_product(page, job.selectors)
    if job.extraction_type is ExtractionType.CUSTOM:
        script = job.selectors.get("script")
        if not script:
            raise ValueError("custom extraction requires a 'script' selector containing evaluation code")
        result = await page.evaluate(script)
        if isinstance(result, list):
            return result
        return [result]
    raise ValueError(f"Unsupported extraction type: {job.extraction_type}")


async def _extract_table(page: Page, selector: str | None) -> List[Dict[str, Any]]:
    script = """
    (sel) => {
        const table = sel ? document.querySelector(sel) : document.querySelector('table');
        if (!table) {
            return [];
        }
        const headerCells = table.querySelectorAll('thead th');
        const bodyRows = table.querySelectorAll('tbody tr');
        const headers = Array.from(headerCells).map(cell => cell.innerText.trim());
        const rows = bodyRows.length ? bodyRows : table.querySelectorAll('tr');
        return Array.from(rows).map((row) => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            const record = {};
            const size = Math.max(headers.length, cells.length);
            for (let index = 0; index < size; index += 1) {
                const header = headers[index] || `column_${index + 1}`;
                const cell = cells[index];
                record[header] = cell ? cell.innerText.trim() : '';
            }
            return record;
        }).filter(record => Object.values(record).some(value => value));
    }
    """
    return await page.evaluate(script, selector)


async def _extract_article(page: Page, selector: str | None) -> Dict[str, Any] | None:
    script = """
    (sel) => {
        const root = sel ? document.querySelector(sel) : document.querySelector('article') || document.body;
        if (!root) {
            return null;
        }
        const titleElement = root.querySelector('h1, h2, h3') || document.querySelector('title');
        return {
            title: titleElement ? titleElement.innerText.trim() : document.title || '',
            content: root.innerText.trim(),
        };
    }
    """
    return await page.evaluate(script, selector)


async def _extract_product(page: Page, selectors: Dict[str, str]) -> List[Dict[str, Any]]:
    script = """
    (config) => {
        const defaults = {
            name: 'h1',
            price: '[data-price], .price, .current-price',
            description: '[data-description], .description, .product-description',
            breadcrumbs: '.breadcrumbs li',
            images: 'img',
        };
        const merged = { ...defaults, ...config };
        const getText = (sel) => {
            const node = document.querySelector(sel);
            return node ? node.textContent.trim() : '';
        };
        const getAllText = (sel) => Array.from(document.querySelectorAll(sel)).map((node) => node.textContent.trim()).filter(Boolean);
        const getImages = (sel) => Array.from(document.querySelectorAll(sel)).map((node) => node.getAttribute('src')).filter(Boolean);
        return [{
            name: getText(merged.name),
            price: getText(merged.price),
            description: getText(merged.description),
            breadcrumbs: getAllText(merged.breadcrumbs),
            images: getImages(merged.images),
        }];
    }
    """
    return await page.evaluate(script, selectors)
