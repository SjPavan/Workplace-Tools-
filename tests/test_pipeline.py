"""Unit tests for the forecasting pipeline."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from prediction_service.cache import ForecastCache
from prediction_service.config import MODEL_REGISTRY, DEFAULT_MODEL_VERSION, ModelConfig
from prediction_service.pipeline import ForecastingPipeline


class StubAdapter:
    def __init__(self, predictions: list[dict[str, float]]):
        self.predictions = predictions
        self.calls = 0

    def generate_forecast(self, *args, **kwargs):
        self.calls += 1
        return {
            "predictions": self.predictions,
            "model_insights": {"adapter": "stub", "calls": self.calls},
        }


class StubFactory:
    def __init__(self, adapter: StubAdapter):
        self.adapter = adapter
        self.created_configs: list[ModelConfig] = []

    def create(self, config: ModelConfig):
        self.created_configs.append(config)
        return self.adapter


@pytest.fixture
def sample_series() -> list[dict[str, float]]:
    base = datetime(2024, 1, 1)
    return [
        {"timestamp": base + timedelta(days=i), "value": float(i)} for i in range(5)
    ]


@pytest.fixture
def stub_adapter() -> StubAdapter:
    predictions = [
        {"timestamp": "2024-01-06T00:00:00", "value": 5.0, "lower": 4.5, "upper": 5.5},
        {"timestamp": "2024-01-07T00:00:00", "value": 6.0, "lower": 5.5, "upper": 6.5},
    ]
    return StubAdapter(predictions)


@pytest.fixture
def pipeline(stub_adapter: StubAdapter) -> ForecastingPipeline:
    factory = StubFactory(stub_adapter)
    cache = ForecastCache(ttl_seconds=None)
    return ForecastingPipeline(cache=cache, model_factory=factory)


def test_forecast_returns_predictions_and_metadata(pipeline: ForecastingPipeline, sample_series):
    result = pipeline.forecast(series=sample_series, horizon=2)

    assert result.horizon == 2
    assert result.model_version == DEFAULT_MODEL_VERSION
    assert result.cached is False
    assert result.pattern_summary == "upward_trend"
    assert len(result.predictions) == 2
    assert result.metadata["backend"] == MODEL_REGISTRY[DEFAULT_MODEL_VERSION].backend
    assert "model_insights" in result.metadata


def test_forecast_results_are_cached(pipeline: ForecastingPipeline, sample_series, stub_adapter: StubAdapter):
    first = pipeline.forecast(series=sample_series, horizon=2)
    second = pipeline.forecast(series=sample_series, horizon=2)

    assert first.cached is False
    assert second.cached is True
    assert stub_adapter.calls == 1


def test_cache_is_sensitive_to_overrides(pipeline: ForecastingPipeline, sample_series, stub_adapter: StubAdapter):
    pipeline.forecast(series=sample_series, horizon=2, config_overrides={"new_param": 1})
    pipeline.forecast(series=sample_series, horizon=2, config_overrides={"new_param": 2})

    assert stub_adapter.calls == 2


def test_invalid_horizon_raises(pipeline: ForecastingPipeline, sample_series):
    with pytest.raises(ValueError):
        pipeline.forecast(series=sample_series, horizon=0)


def test_get_forecast_returns_stored_result(pipeline: ForecastingPipeline, sample_series):
    result = pipeline.forecast(series=sample_series, horizon=2)
    retrieved = pipeline.get_forecast(result.forecast_id)

    assert retrieved is result


def test_get_forecast_for_unknown_id_returns_none(pipeline: ForecastingPipeline):
    assert pipeline.get_forecast("missing") is None
