# Prediction Analytics Engine

## Overview

The prediction analytics engine exposes a lightweight forecasting pipeline that bundles:

- Versioned model configurations for both **Prophet** and **sktime Theta** forecasters.
- An in-memory caching layer keyed by dataset, forecast horizon, and configuration digest.
- A FastAPI microservice offering endpoints to submit user datasets, inspect the model registry, and fetch cached predictions.
- Pattern recognition heuristics (trend/volatility classification) and confidence intervals sourced directly from the underlying model adapters.

## Endpoints

| Method | Endpoint              | Description |
|--------|-----------------------|-------------|
| GET    | `/health`             | Service liveness probe. |
| GET    | `/configs`            | List available model configurations and metadata. |
| POST   | `/forecast`           | Submit a time series, choose the horizon and model version, and receive a forecast with 95% confidence intervals. |
| GET    | `/forecast/{id}`      | Retrieve a previously generated forecast by identifier. |

Requests accept ISO-8601 timestamps and numeric values. Confidence coverage defaults to `0.95` but can be overridden.

## Usage

1. Install dependencies inside a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install fastapi uvicorn prophet sktime pandas
   ```

2. Start the service:

   ```bash
   uvicorn prediction_service.app:app --reload
   ```

3. Submit a forecast request:

   ```bash
   curl -X POST http://localhost:8000/forecast \
     -H "Content-Type: application/json" \
     -d '{
           "series": [
             {"timestamp": "2024-01-01T00:00:00", "value": 10},
             {"timestamp": "2024-01-02T00:00:00", "value": 12},
             {"timestamp": "2024-01-03T00:00:00", "value": 13}
           ],
           "horizon": 7,
           "model_version": "prophet-additive-v1",
           "coverage": 0.9
         }'
   ```

## Limitations

- **Cold-start cost**: Prophet and sktime models incur noticeable fit times on first use. Utilize the caching layer to amortize repeated forecasts for the same dataset/horizon.
- **Library dependencies**: Prophet and sktime require C++/scientific build toolchains. Ensure the runtime environment can compile or install pre-built wheels.
- **Data scale**: The reference implementation keeps all requests in memory for caching and retrieval, so extremely large datasets or high-concurrency workloads will need a persistent cache (Redis/Memcached) and storage layer.
- **Irregular cadences**: Frequency detection covers common cadences (hourly, daily, weekly). Irregular or sparse series may require manual frequency specification via configuration overrides.
- **Confidence intervals**: Propagated intervals come from the underlying libraries. When packages cannot be imported, the API returns a 424 status indicating the missing dependency.

## Compute considerations

- Prophet's compute complexity grows linearly with the number of observations but uses Stan under the hood, which can become CPU intensive for multi-year, sub-hourly data.
- Theta forecasting is lightweight but may still allocate large intermediate arrays for long horizons; consider down-sampling when possible.
- To bound CPU use, host deployments should limit concurrent request workers and rely on the caching TTL (`ForecastCache(ttl_seconds=...)`) to avoid redundant fits.

## Testing

Unit tests for the forecasting pipeline live under `tests/test_pipeline.py`. They validate configuration merging, caching behaviour, and forecast bookkeeping without requiring the heavy third-party libraries. Run the suite with:

```bash
pytest
```
