"""Convert scraped datasets into serialized artifacts."""

from __future__ import annotations

import csv
import io
import json
from typing import Dict, Iterable, List

import pandas as pd

_CONTENT_TYPES = {
    "json": "application/json",
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


class DatasetExporter:
    """Serialize records into the requested output formats."""

    def __init__(self, records: Iterable[dict]) -> None:
        self._records = list(records)

    def build(self, formats: List[str]) -> Dict[str, tuple[bytes, str]]:
        artifacts: Dict[str, tuple[bytes, str]] = {}
        for fmt in formats:
            fmt_lower = fmt.lower()
            if fmt_lower == "json":
                artifacts["json"] = (self._to_json_bytes(), _CONTENT_TYPES["json"])
            elif fmt_lower == "csv":
                artifacts["csv"] = (self._to_csv_bytes(), _CONTENT_TYPES["csv"])
            elif fmt_lower in {"xls", "xlsx", "excel"}:
                artifacts["xlsx"] = (self._to_excel_bytes(), _CONTENT_TYPES["xlsx"])
            else:
                raise ValueError(f"Unsupported export format: {fmt}")
        return artifacts

    def _to_json_bytes(self) -> bytes:
        return json.dumps(self._records, ensure_ascii=False, indent=2).encode("utf-8")

    def _to_csv_bytes(self) -> bytes:
        buffer = io.StringIO()
        records = self._records or [{}]
        fieldnames = sorted({field for record in records for field in record.keys()})
        writer = csv.DictWriter(buffer, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(record)
        return buffer.getvalue().encode("utf-8")

    def _to_excel_bytes(self) -> bytes:
        dataframe = pd.DataFrame(self._records)
        stream = io.BytesIO()
        dataframe.to_excel(stream, index=False)
        return stream.getvalue()
