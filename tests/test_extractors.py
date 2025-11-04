import pytest

from scraping_worker.extractors import extract_records
from scraping_worker.jobs import ExtractionType, ScrapingJob


class FakePage:
    def __init__(self, return_value):
        self.return_value = return_value
        self.scripts = []

    async def evaluate(self, script, argument=None):
        self.scripts.append(script)
        if argument is not None:
            self.scripts.append(argument)
        return self.return_value


@pytest.mark.asyncio
async def test_extract_records_table_dispatch():
    page = FakePage([{"column_1": "value"}])
    job = ScrapingJob(
        id="job-table",
        url="https://example.com/table",
        extraction_type=ExtractionType.TABLE,
        selectors={"table": "table"},
    )

    records = await extract_records(page, job)

    assert records == [{"column_1": "value"}]
    assert "document.querySelector" in page.scripts[0]


@pytest.mark.asyncio
async def test_extract_records_article_dispatch():
    page = FakePage({"title": "Hello", "content": "World"})
    job = ScrapingJob(
        id="job-article",
        url="https://example.com",
        extraction_type=ExtractionType.ARTICLE,
        selectors={"article": "article"},
    )

    records = await extract_records(page, job)
    assert records == [{"title": "Hello", "content": "World"}]


@pytest.mark.asyncio
async def test_extract_records_custom_requires_script():
    page = FakePage([])
    job = ScrapingJob(
        id="job-custom",
        url="https://example.com",
        extraction_type=ExtractionType.CUSTOM,
        selectors={},
    )

    with pytest.raises(ValueError):
        await extract_records(page, job)
