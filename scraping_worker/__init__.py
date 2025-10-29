"""Scraping worker service package."""

from .config import WorkerConfig
from .processor import ScrapingWorker

__all__ = ["WorkerConfig", "ScrapingWorker"]
