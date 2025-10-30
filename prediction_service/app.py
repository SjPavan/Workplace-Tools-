"""FastAPI entrypoint for the prediction analytics engine."""

from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException

from .config import ConfigNotFoundError, list_model_configs
from .model_factory import MissingDependencyError
from .pipeline import ForecastingPipeline, ForecastResult
from .schemas import (
    ForecastPoint,
    ForecastRequest,
    ForecastResponse,
    ModelConfigResponse,
)

app = FastAPI(
    title="Prediction Analytics Engine",
    description="Service for trend forecasting and pattern recognition leveraging Prophet and sktime.",
    version="0.1.0",
)

pipeline = ForecastingPipeline()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/configs", response_model=List[ModelConfigResponse])
def list_configs() -> List[ModelConfigResponse]:
    return [
        ModelConfigResponse(
            version=config.version,
            backend=config.backend,
            description=config.description,
            metadata=dict(config.metadata),
        )
        for config in list_model_configs()
    ]


@app.post("/forecast", response_model=ForecastResponse)
def create_forecast(request: ForecastRequest) -> ForecastResponse:
    try:
        result = pipeline.forecast(
            series=[point.dict() for point in request.series],
            horizon=request.horizon,
            model_version=request.model_version,
            config_overrides=request.config_overrides,
            include_history=request.include_history,
            coverage=request.coverage,
        )
    except ConfigNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MissingDependencyError as exc:
        raise HTTPException(status_code=424, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return _result_to_response(result)


@app.get("/forecast/{forecast_id}", response_model=ForecastResponse)
def get_forecast(forecast_id: str) -> ForecastResponse:
    result = pipeline.get_forecast(forecast_id)
    if not result:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return _result_to_response(result)


def _result_to_response(result: ForecastResult) -> ForecastResponse:
    return ForecastResponse(
        forecast_id=result.forecast_id,
        model_version=result.model_version,
        horizon=result.horizon,
        generated_at=result.generated_at,
        cached=result.cached,
        pattern_summary=result.pattern_summary,
        predictions=[
            ForecastPoint(
                timestamp=_parse_timestamp(pred["timestamp"]),
                value=pred["value"],
                lower=pred["lower"],
                upper=pred["upper"],
            )
            for pred in result.predictions
        ],
        metadata=result.metadata,
    )


def _parse_timestamp(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    normalized = value.replace("Z", "+00:00") if isinstance(value, str) else value
    try:
        return datetime.fromisoformat(normalized)
    except ValueError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Invalid timestamp value: {value}") from exc
