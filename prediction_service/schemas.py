"""Pydantic schemas for the forecasting service API."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class TimeSeriesPoint(BaseModel):
    timestamp: datetime = Field(..., description="ISO 8601 timestamp for the observation")
    value: float = Field(..., description="Observed numeric value at the timestamp")


class ForecastRequest(BaseModel):
    series: List[TimeSeriesPoint] = Field(..., min_items=2, description="Historical time series data")
    horizon: int = Field(..., gt=0, description="Number of future steps to forecast")
    model_version: Optional[str] = Field(
        default=None, description="Versioned model configuration to use"
    )
    config_overrides: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional overrides applied on top of the stored configuration",
    )
    include_history: bool = Field(
        default=False,
        description="Include the historical portion of the data when generating forecasts",
    )
    coverage: float = Field(
        default=0.95,
        description="Desired prediction interval coverage (between 0 and 1)",
    )

    @validator("series")
    def validate_series_sorted(cls, value: List[TimeSeriesPoint]) -> List[TimeSeriesPoint]:
        timestamps = [point.timestamp for point in value]
        if timestamps != sorted(timestamps):
            raise ValueError("Time series must be ordered by ascending timestamp")
        return value

    @validator("coverage")
    def validate_coverage(cls, value: float) -> float:
        if not 0 < value < 1:
            raise ValueError("Coverage must be between 0 and 1")
        return value


class ForecastPoint(BaseModel):
    timestamp: datetime
    value: float
    lower: float
    upper: float


class ForecastResponse(BaseModel):
    forecast_id: str
    model_version: str
    horizon: int
    generated_at: datetime
    cached: bool
    pattern_summary: str
    predictions: List[ForecastPoint]
    metadata: Dict[str, Any]


class ModelConfigResponse(BaseModel):
    version: str
    backend: str
    description: str
    metadata: Dict[str, Any]
