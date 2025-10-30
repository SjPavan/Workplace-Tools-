# Workplace Tools

A collection of productivity utilities and services. This repository now includes a prediction analytics engine for forecasting trends across user-provided time series datasets.

## Prediction analytics engine

- **Service location:** `prediction_service/app.py`
- **Core pipeline:** `prediction_service/pipeline.py`
- **Model registry:** `prediction_service/config.py`
- **Caching:** `prediction_service/cache.py`
- **API schemas:** `prediction_service/schemas.py`
- **Unit tests:** `tests/test_pipeline.py`
- **Documentation:** `docs/prediction_service.md`

### Getting started

1. Create and activate a virtual environment.
2. Install the runtime dependencies (`fastapi`, `uvicorn`, `prophet`, `sktime`, `pandas`).
3. Launch the service with `uvicorn prediction_service.app:app`.
4. Review `docs/prediction_service.md` for API details, limitations, and compute considerations.

The service exposes endpoints for posting time series data, selecting forecast horizons, and retrieving cached predictions enriched with confidence intervals and pattern recognition summaries.
