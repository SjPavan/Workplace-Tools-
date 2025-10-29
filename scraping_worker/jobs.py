"""Job models shared across the scraping worker components."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ExtractionType(str, Enum):
    TABLE = "table"
    ARTICLE = "article"
    PRODUCT = "product"
    CUSTOM = "custom"


class JobState(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


@dataclass
class ScrapingJob:
    id: str
    url: str
    extraction_type: ExtractionType
    selectors: Dict[str, str] = field(default_factory=dict)
    custom_scripts: List[str] = field(default_factory=list)
    export_formats: List[str] = field(default_factory=lambda: ["json"])
    wait_for_selector: Optional[str] = None
    supabase_path_prefix: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "url": self.url,
            "extraction_type": self.extraction_type.value,
            "selectors": self.selectors,
            "custom_scripts": list(self.custom_scripts),
            "export_formats": list(self.export_formats),
            "wait_for_selector": self.wait_for_selector,
            "supabase_path_prefix": self.supabase_path_prefix,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "ScrapingJob":
        extraction_type = payload.get("extraction_type")
        if isinstance(extraction_type, ExtractionType):
            extraction = extraction_type
        else:
            extraction = ExtractionType(extraction_type)

        return cls(
            id=payload["id"],
            url=payload["url"],
            extraction_type=extraction,
            selectors=payload.get("selectors", {}) or {},
            custom_scripts=payload.get("custom_scripts", []) or [],
            export_formats=payload.get("export_formats", []) or ["json"],
            wait_for_selector=payload.get("wait_for_selector"),
            supabase_path_prefix=payload.get("supabase_path_prefix"),
            metadata=payload.get("metadata", {}) or {},
        )


@dataclass
class JobStatus:
    job_id: str
    state: JobState
    detail: Optional[str] = None
    stored_files: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "state": self.state.value,
            "detail": self.detail,
            "stored_files": self.stored_files,
            "metadata": self.metadata,
        }
