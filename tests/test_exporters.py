import json

import pandas as pd
import pytest

from scraping_worker.exporters import DatasetExporter


def test_dataset_exporter_builds_requested_formats(tmp_path):
    records = [
        {"name": "Widget", "price": 3.5},
        {"name": "Gadget", "price": 7.25},
    ]

    exporter = DatasetExporter(records)
    artifacts = exporter.build(["json", "csv", "xlsx"])

    assert set(artifacts.keys()) == {"json", "csv", "xlsx"}

    json_bytes, content_type = artifacts["json"]
    assert content_type == "application/json"
    parsed = json.loads(json_bytes.decode("utf-8"))
    assert parsed == records

    csv_bytes, content_type = artifacts["csv"]
    assert content_type == "text/csv"
    assert "name" in csv_bytes.decode("utf-8")

    xlsx_bytes, content_type = artifacts["xlsx"]
    assert content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    file_path = tmp_path / "dataset.xlsx"
    file_path.write_bytes(xlsx_bytes)
    dataframe = pd.read_excel(file_path)
    assert list(dataframe.columns) == ["name", "price"]
    assert dataframe.iloc[0]["name"] == "Widget"
