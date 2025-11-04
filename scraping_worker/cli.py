"""Command line utilities for interacting with the scraping worker."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import uuid
from pathlib import Path
from typing import Any, Dict

from .config import WorkerConfig
from .jobs import ScrapingJob
from .processor import ScrapingWorker
from .queue import RedisJobQueue


async def _cmd_run_worker(config: WorkerConfig) -> None:
    worker = ScrapingWorker(config)
    try:
        await worker.run_forever()
    except KeyboardInterrupt:  # pragma: no cover - runtime path
        await worker.stop()


async def _cmd_submit_job(config: WorkerConfig, payload: Dict[str, Any]) -> ScrapingJob:
    job_data = dict(payload)
    job_data.setdefault("id", str(uuid.uuid4()))
    job = ScrapingJob.from_dict(job_data)

    queue = RedisJobQueue(config.redis_url, config.redis_queue)
    try:
        await queue.enqueue(job)
    finally:
        await queue.close()
    return job


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Scraping worker utilities")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("worker", help="Run the scraping worker loop")

    submit = subparsers.add_parser("submit", help="Submit a scraping job definition")
    submit.add_argument("job_file", type=Path, help="Path to a JSON file describing the job")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    config = WorkerConfig.from_env()

    if args.command == "worker":
        asyncio.run(_cmd_run_worker(config))
        return 0

    if args.command == "submit":
        payload = json.loads(args.job_file.read_text())
        job = asyncio.run(_cmd_submit_job(config, payload))
        print(job.to_dict())  # noqa: T201 - CLI output
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    sys.exit(main())
