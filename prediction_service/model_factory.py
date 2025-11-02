"""Adapters for integrating third-party forecasting libraries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable, List

import pandas as pd

from .config import ModelConfig


class MissingDependencyError(ImportError):
    """Raised when an optional third-party dependency is not available."""


class BaseModelAdapter:
    """Protocol-like base class for forecast adapters."""

    def generate_forecast(
        self,
        history: pd.DataFrame,
        horizon: int,
        freq: str,
        include_history: bool = False,
        coverage: float = 0.95,
    ) -> dict[str, Any]:
        raise NotImplementedError


@dataclass
class ProphetAdapter(BaseModelAdapter):
    """Adapter for the Prophet forecasting library."""

    parameters: dict[str, Any]

    def generate_forecast(
        self,
        history: pd.DataFrame,
        horizon: int,
        freq: str,
        include_history: bool = False,
        coverage: float = 0.95,
    ) -> dict[str, Any]:
        try:
            from prophet import Prophet  # type: ignore
        except ImportError as exc:  # pragma: no cover - guarded by tests
            raise MissingDependencyError(
                "Prophet is required for backend 'prophet'. Install it with `pip install prophet`."
            ) from exc

        model = Prophet(**self.parameters)
        model.fit(history)
        future = model.make_future_dataframe(periods=horizon, freq=freq, include_history=include_history)
        forecast = model.predict(future)
        tail = forecast.tail(horizon)
        predictions = _rows_to_prediction_payload(
            tail[["ds", "yhat", "yhat_lower", "yhat_upper"]].itertuples(index=False)
        )
        return {
            "predictions": predictions,
            "model_insights": {
                "components": [
                    comp for comp in (forecast.columns if "trend" in forecast.columns else [])
                ],
                "coverage": coverage,
            },
        }


@dataclass
class ThetaAdapter(BaseModelAdapter):
    """Adapter for sktime Theta forecaster backend."""

    parameters: dict[str, Any]

    def generate_forecast(
        self,
        history: pd.DataFrame,
        horizon: int,
        freq: str,
        include_history: bool = False,
        coverage: float = 0.95,
    ) -> dict[str, Any]:
        try:
            from sktime.forecasting.base import ForecastingHorizon
            from sktime.forecasting.theta import ThetaForecaster
        except ImportError as exc:  # pragma: no cover - guarded by tests
            raise MissingDependencyError(
                "sktime is required for backend 'sktime.theta'. Install it with `pip install sktime`."
            ) from exc

        y = history.set_index(pd.DatetimeIndex(history["ds"], freq=freq))["y"]
        model = ThetaForecaster(**self.parameters)
        model.fit(y)
        fh = ForecastingHorizon(list(range(1, horizon + 1)), is_relative=True)
        mean_forecast = model.predict(fh=fh)
        interval = model.predict_interval(fh=fh, coverage=[coverage])

        lower_col, upper_col = _resolve_interval_columns(interval.columns, coverage)
        lower_values = interval[lower_col].values if lower_col else mean_forecast.values
        upper_values = interval[upper_col].values if upper_col else mean_forecast.values

        index = mean_forecast.index.to_timestamp()
        predictions = [
            {
                "timestamp": index[i].to_pydatetime().isoformat(),
                "value": float(mean_forecast.values[i]),
                "lower": float(lower_values[i]),
                "upper": float(upper_values[i]),
            }
            for i in range(len(mean_forecast))
        ]

        return {
            "predictions": predictions,
            "model_insights": {
                "seasonal_period": self.parameters.get("sp"),
                "coverage": coverage,
            },
        }


class ModelFactory:
    """Factory responsible for instantiating adapters from configuration."""

    def create(self, config: ModelConfig) -> BaseModelAdapter:
        backend = config.backend
        if backend == "prophet":
            return ProphetAdapter(dict(config.parameters))
        if backend == "sktime.theta":
            return ThetaAdapter(dict(config.parameters))
        raise ValueError(f"Unsupported backend: {backend}")


def _rows_to_prediction_payload(rows: Iterable[Any]) -> List[dict[str, Any]]:
    payload: List[dict[str, Any]] = []
    for row in rows:
        ds, yhat, yhat_lower, yhat_upper = row
        payload.append(
            {
                "timestamp": ds.isoformat() if hasattr(ds, "isoformat") else str(ds),
                "value": float(yhat),
                "lower": float(yhat_lower),
                "upper": float(yhat_upper),
            }
        )
    return payload


def _resolve_interval_columns(columns: Any, coverage: float) -> tuple[Any | None, Any | None]:
    """Best-effort resolution of interval columns returned by sktime."""

    lower_col = None
    upper_col = None
    if hasattr(columns, "__iter__"):
        for col in columns:
            if isinstance(col, tuple):
                if any(str(part).lower() == "lower" for part in col) and any(
                    str(part) == str(coverage) for part in col
                ):
                    lower_col = col
                if any(str(part).lower() == "upper" for part in col) and any(
                    str(part) == str(coverage) for part in col
                ):
                    upper_col = col
            else:
                text = str(col).lower()
                if "lower" in text:
                    lower_col = col
                if "upper" in text:
                    upper_col = col
    return lower_col, upper_col
