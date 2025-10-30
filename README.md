# Financial Analytics Module

This repository now includes a lightweight financial analytics service that powers budget tracking, transaction categorisation, expense dashboards, investment insights, and forecasting endpoints. The service is implemented with Node.js/Express and ships with a simple in-memory data store so it can run without additional infrastructure. When you are ready to persist data, reference the stored procedure catalogue under [`docs/stored_procedures.md`](docs/stored_procedures.md).

## Features

- **Budget tracking** – configure monthly category budgets and monitor variance.
- **Transaction categorisation** – rule-based engine with keyword heuristics applied to CSV imports and manual entries.
- **CSV import & manual capture** – drop in raw bank exports or submit single transactions through the API.
- **Expense analytics** – summaries, category breakdowns, top merchants, and trend data for dashboard widgets.
- **Investment insights** – rolling contribution trends, streaks, and guidance for savings & investment activity.
- **Forecasting** – linear regression projections with optional Prophet-based forecasts when Python dependencies are available.
- **Recommendations** – generated guidance that combines budgets, analytics, forecasts, and investment insights.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the API server (defaults to port `3000`):
   ```bash
   npm start
   ```
3. Exercise the endpoints with your preferred REST client (e.g., curl, Postman, or the collection below).

### Key Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/health` | Health probe for monitoring/uptime checks. |
| `GET`  | `/api/transactions` | List transactions with optional `category`, `from`, and `to` filters (ISO dates). |
| `POST` | `/api/transactions` | Create a manual transaction (JSON body). |
| `POST` | `/api/import/csv` | Import transactions from CSV (send `text/csv` or JSON `{ "csv": "..." }`). |
| `GET`  | `/api/budgets` | Retrieve current budget configuration. |
| `POST` | `/api/budgets` | Upsert a budget entry `{ category, amount, period }`. |
| `GET`  | `/api/analytics/summary` | Expense summary, breakdowns, and budget report snapshots. |
| `GET`  | `/api/analytics/trends?months=6` | Time-series totals for dashboard charts. |
| `GET`  | `/api/forecast?periods=6&useProphet=true` | Forecast upcoming expenses, optionally using Prophet. |
| `GET`  | `/api/investments/insights` | Investment and savings contribution analytics. |
| `GET`  | `/api/recommendations` | Actionable guidance derived from budgets, forecasts, and investments. |

### CSV Expectations

The parser accepts flexible headers (`date`, `description`, `amount`, `merchant`, `account`, `tags`) and understands common aliases (`transaction_date`, `value`, `payee`, etc.). Amounts may include currency symbols, commas, or parentheses for negatives. Rows missing a date, amount, or description are rejected with descriptive errors.

### Forecasting with Prophet

Linear regression forecasts are always available. To enable Prophet-based projections with confidence intervals:

1. Ensure Python 3.9+ is installed.
2. Install dependencies in the runtime environment:
   ```bash
   pip install prophet pandas
   ```
3. Call the forecast endpoint with `useProphet=true`. The service automatically falls back to linear regression if Prophet is unavailable.

## Testing

Run the automated test suite (CSV import parsing and forecasting behaviour) with:

```bash
npm test
```

The suite verifies the CSV parser normalisation rules and validates that forecasting falls back to linear regression whenever Prophet is missing.

## Database Integration

The default store runs in memory. For production deployments, implement the stored procedures outlined in [`docs/stored_procedures.md`](docs/stored_procedures.md) to back the service with PostgreSQL or another relational database. Those procedures preserve the import semantics, budgeting logic, and analytics roll-ups used by the API.
