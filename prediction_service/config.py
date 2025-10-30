"""Configuration registry for the prediction analytics engine."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Mapping


class ConfigNotFoundError(KeyError):
    """Raised when a requested model configuration version is unavailable."""


@dataclass(frozen=True)
class ModelConfig:
    """Container for versioned model configuration metadata."""

    version: str
    backend: str
    parameters: Mapping[str, Any] = field(default_factory=dict)
    description: str = ""
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def merged(self, overrides: Mapping[str, Any] | None = None) -> "ModelConfig":
        """Return a new config object with parameters merged with overrides."""

        if not overrides:
            return self
        merged_params: Dict[str, Any] = dict(self.parameters)
        merged_params.update(overrides)
        return ModelConfig(
            version=self.version,
            backend=self.backend,
            parameters=merged_params,
            description=self.description,
            metadata=self.metadata,
        )


MODEL_REGISTRY: Dict[str, ModelConfig] = {
    "prophet-additive-v1": ModelConfig(
        version="prophet-additive-v1",
        backend="prophet",
        parameters={
            "seasonality_mode": "additive",
            "daily_seasonality": False,
            "weekly_seasonality": True,
            "yearly_seasonality": True,
            "changepoint_prior_scale": 0.05,
        },
        description="Prophet configuration optimised for business trend tracking",
        metadata={"supports_confidence_intervals": True},
    ),
    "theta-seasonal-v1": ModelConfig(
        version="theta-seasonal-v1",
        backend="sktime.theta",
        parameters={
            "sp": 7,
            "trend": "additive",
        },
        description="Theta forecaster tuned for weekly seasonal data",
        metadata={"supports_confidence_intervals": True},
    ),
}

DEFAULT_MODEL_VERSION = "prophet-additive-v1"


def get_model_config(version: str | None) -> ModelConfig:
    """Fetch a model configuration by version, falling back to the default."""

    key = version or DEFAULT_MODEL_VERSION
    try:
        return MODEL_REGISTRY[key]
    except KeyError as exc:  # pragma: no cover - defensive guard
        raise ConfigNotFoundError(f"Unknown model configuration: {key}") from exc


def list_model_configs() -> list[ModelConfig]:
    """Return all registered model configurations."""

    return list(MODEL_REGISTRY.values())
