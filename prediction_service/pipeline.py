"""Core forecasting pipeline orchestration."""

from __future__ import annotations

import copy
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
from typing import Any, Iterable, List, Mapping, MutableMapping, Sequence
from uuid import uuid4

import pandas as pd

from .cache import ForecastCache
from .config import ModelConfig, get_model_config
from .model_factory import ModelFactory


@dataclass
class ForecastResult:
    forecast_id: str
    generated_at: datetime
    model_version: str
    horizon: int
    cached: bool
    pattern_summary: str
    predictions: List[dict[str, Any]]
    metadata: dict[str, Any]


class ForecastingPipeline:
    """High-level prediction pipeline with caching and model registry support."""

    def __init__(
        self,
        cache: ForecastCache | None = None,
        model_factory: ModelFactory | None = None,
    ) -> None:
        self.cache = cache or ForecastCache()
        self.model_factory = model_factory or ModelFactory()
        self._store: MutableMapping[str, ForecastResult] = {}

    def forecast(
        self,
        series: Sequence[Mapping[str, Any]] | Sequence[Any],
        horizon: int,
        model_version: str | None = None,
        config_overrides: Mapping[str, Any] | None = None,
        include_history: bool = False,
        coverage: float = 0.95,
    ) -> ForecastResult:
        if horizon <= 0:
            raise ValueError("horizon must be greater than zero")
        config = self._resolve_config(model_version, config_overrides)
        dataset_hash = _hash_series(series)
        config_digest = _hash_dict(config.parameters)
        cached_payload = self.cache.get(dataset_hash, config.version, horizon, config_digest)

        if cached_payload is not None:
            payload = copy.deepcopy(cached_payload)
            cached = True
        else:
            payload = self._generate(series, horizon, config, include_history, coverage)
            self.cache.set(dataset_hash, config.version, horizon, copy.deepcopy(payload), config_digest)
            cached = False

        predictions = payload["predictions"]
        pattern_summary = _summarise_pattern(series, predictions)
        generated_at = datetime.now(timezone.utc)
        forecast_id = str(uuid4())

        metadata = {
            "backend": config.backend,
            "coverage": coverage,
            "cached": cached,
        }
        if "model_insights" in payload:
            metadata["model_insights"] = payload["model_insights"]

        result = ForecastResult(
            forecast_id=forecast_id,
            generated_at=generated_at,
            model_version=config.version,
            horizon=horizon,
            cached=cached,
            pattern_summary=pattern_summary,
            predictions=[
                {
                    "timestamp": pred["timestamp"],
                    "value": float(pred["value"]),
                    "lower": float(pred.get("lower", pred["value"])),
                    "upper": float(pred.get("upper", pred["value"])),
                }
                for pred in predictions
            ],
            metadata=metadata,
        )
        self._store[forecast_id] = result
        return result

    def get_forecast(self, forecast_id: str) -> ForecastResult | None:
        return self._store.get(forecast_id)

    def _resolve_config(
        self,
        model_version: str | None,
        config_overrides: Mapping[str, Any] | None,
    ) -> ModelConfig:
        base_config = get_model_config(model_version)
        return base_config.merged(config_overrides)

    def _generate(
        self,
        series: Sequence[Mapping[str, Any]] | Sequence[Any],
        horizon: int,
        config: ModelConfig,
        include_history: bool,
        coverage: float,
    ) -> dict[str, Any]:
        frame = _series_to_dataframe(series)
        freq = _infer_frequency(frame["ds"]) or "D"
        adapter = self.model_factory.create(config)
        payload = adapter.generate_forecast(
            frame,
            horizon=horizon,
            freq=freq,
            include_history=include_history,
            coverage=coverage,
        )
        return payload


def _series_to_dataframe(series: Sequence[Mapping[str, Any]] | Sequence[Any]) -> pd.DataFrame:
    if not series:
        raise ValueError("series must contain at least one observation")

    records: List[dict[str, Any]] = []
    for item in series:
        if isinstance(item, Mapping):
            timestamp = item.get("timestamp")
            value = item.get("value")
        else:
            timestamp = getattr(item, "timestamp", None)
            value = getattr(item, "value", None)
        if timestamp is None or value is None:
            raise ValueError("Each data point must include 'timestamp' and 'value'")
        if not isinstance(timestamp, datetime):
            timestamp = pd.to_datetime(timestamp)
        records.append({"ds": pd.Timestamp(timestamp), "y": float(value)})

    frame = pd.DataFrame(records).sort_values("ds").reset_index(drop=True)
    if frame["ds"].duplicated().any():
        raise ValueError("Timestamps must be unique")
    return frame


def _infer_frequency(values: Iterable[pd.Timestamp]) -> str | None:
    timestamps = list(values)
    if len(timestamps) < 2:
        return None
    deltas = [
        (timestamps[i + 1] - timestamps[i]).to_pytimedelta()
        for i in range(len(timestamps) - 1)
    ]
    if not deltas:
        return None
    delta = min(deltas)
    if delta.days == 1:
        return "D"
    if delta.days == 7:
        return "W"
    if delta.days == 0 and delta.seconds == 3600:
        return "H"
    if delta.days == 30:
        return "30D"
    return None


def _summarise_pattern(
    history: Sequence[Mapping[str, Any]] | Sequence[Any],
    predictions: Sequence[Mapping[str, Any]],
) -> str:
    values: List[float] = []
    for item in history:
        if isinstance(item, Mapping):
            value = item.get("value")
        else:
            value = getattr(item, "value", None)
        if value is None:
            continue
        values.append(float(value))
    for pred in predictions:
        if isinstance(pred, Mapping):
            value = pred.get("value")
        else:
            value = getattr(pred, "value", None)
        if value is None:
            continue
        values.append(float(value))
    if len(values) < 2:
        return "insufficient_data"
    delta = values[-1] - values[0]
    tolerance = max(0.02 * (max(values) - min(values) + 1e-9), 1e-6)
    if delta > tolerance:
        return "upward_trend"
    if delta < -tolerance:
        return "downward_trend"
    recent_window = values[-5:]
    variation = max(recent_window) - min(recent_window)
    if variation > tolerance * 2:
        return "volatile"
    return "stable"


def _hash_series(series: Sequence[Mapping[str, Any]] | Sequence[Any]) -> str:
    normalized = []
    for item in series:
        if isinstance(item, Mapping):
            ts = item.get("timestamp")
            value = item.get("value")
        else:
            ts = getattr(item, "timestamp", None)
            value = getattr(item, "value", None)
        if ts is None or value is None:
            continue
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        normalized.append({"timestamp": ts_str, "value": float(value)})
    payload = json.dumps(normalized, sort_keys=True)
    return sha256(payload.encode("utf-8")).hexdigest()


def _hash_dict(data: Mapping[str, Any]) -> str:
    return sha256(json.dumps(dict(sorted(data.items())), default=str).encode("utf-8")).hexdigest()
