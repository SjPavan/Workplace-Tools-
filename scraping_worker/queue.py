"""Redis-backed job queue abstraction."""

from __future__ import annotations

import asyncio
import json
from typing import Optional

import redis.asyncio as redis_async

from .jobs import ScrapingJob


class JobQueue:
    """Abstract queue interface."""

    async def enqueue(self, job: ScrapingJob) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def dequeue(self, timeout: int = 1) -> Optional[ScrapingJob]:  # pragma: no cover - interface
        raise NotImplementedError

    async def close(self) -> None:  # pragma: no cover - interface
        raise NotImplementedError


class RedisJobQueue(JobQueue):
    """Redis list backed queue for scraping jobs."""

    def __init__(self, redis_url: str, queue_name: str) -> None:
        self._redis = redis_async.from_url(redis_url, decode_responses=True)
        self._queue_name = queue_name

    async def enqueue(self, job: ScrapingJob) -> None:
        await self._redis.lpush(self._queue_name, json.dumps(job.to_dict()))

    async def dequeue(self, timeout: int = 1) -> Optional[ScrapingJob]:
        item = await self._redis.brpop(self._queue_name, timeout=timeout)
        if item is None:
            return None
        _, payload = item
        data = json.loads(payload)
        return ScrapingJob.from_dict(data)

    async def close(self) -> None:
        await self._redis.aclose()


class InMemoryJobQueue(JobQueue):
    """Simple in-memory queue used for unit tests."""

    def __init__(self) -> None:
        self._queue = asyncio.Queue()

    async def enqueue(self, job: ScrapingJob) -> None:
        await self._queue.put(job)

    async def dequeue(self, timeout: int = 1) -> Optional[ScrapingJob]:
        try:
            job = await asyncio.wait_for(self._queue.get(), timeout=timeout)
        except asyncio.TimeoutError:
            return None
        return job

    async def close(self) -> None:
        while not self._queue.empty():
            self._queue.get_nowait()
            self._queue.task_done()
