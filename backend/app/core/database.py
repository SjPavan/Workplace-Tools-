from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator, Optional

import asyncpg

from app.core.config import settings

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """Return a global asyncpg pool instance."""
    global _pool
    if _pool is None:
        if not settings.database_url:
            raise RuntimeError("DATABASE_URL must be configured before creating a connection pool.")
        _pool = await asyncpg.create_pool(dsn=settings.database_url)
    return _pool


async def close_pool() -> None:
    """Dispose of the global connection pool."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def database_connection() -> AsyncIterator[asyncpg.Connection]:
    pool = await get_pool()
    async with pool.acquire() as connection:
        yield connection


__all__ = ["get_pool", "close_pool", "database_connection"]
