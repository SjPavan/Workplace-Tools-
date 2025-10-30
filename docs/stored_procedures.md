# Financial Analytics Module – Stored Procedure Reference

The current implementation ships with an in-memory data store for ease of testing. When deploying to a relational database (recommended: PostgreSQL), the following stored procedures are required to mirror the behaviours of the in-memory services. They encapsulate transactional inserts, analytics pivots, and budgeting metadata in a way that keeps reporting queries fast and auditable.

> **Naming convention**: all stored procedures are prefixed with `sp_fin_` to indicate they belong to the financial analytics bounded context.

## 1. `sp_fin_import_transaction`

Registers or updates a transaction record during CSV import or manual capture.

```sql
CREATE OR REPLACE PROCEDURE sp_fin_import_transaction(
    p_external_id      TEXT,
    p_event_date       DATE,
    p_description      TEXT,
    p_amount           NUMERIC(14, 2),
    p_category         TEXT,
    p_merchant         TEXT,
    p_account          TEXT,
    p_metadata         JSONB DEFAULT '{}'::JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO fin_transactions (
        external_id,
        event_date,
        description,
        amount,
        category,
        merchant,
        account,
        metadata
    )
    VALUES (
        p_external_id,
        p_event_date,
        p_description,
        p_amount,
        p_category,
        p_merchant,
        p_account,
        p_metadata
    )
    ON CONFLICT (external_id)
        DO UPDATE SET
            event_date = EXCLUDED.event_date,
            description = EXCLUDED.description,
            amount = EXCLUDED.amount,
            category = EXCLUDED.category,
            merchant = EXCLUDED.merchant,
            account = EXCLUDED.account,
            metadata = EXCLUDED.metadata;
END;
$$;
```

## 2. `sp_fin_apply_budget`

Upserts a budget definition per category and period (monthly or quarterly).

```sql
CREATE OR REPLACE PROCEDURE sp_fin_apply_budget(
    p_category   TEXT,
    p_amount     NUMERIC(12, 2),
    p_period     TEXT DEFAULT 'monthly',
    p_notes      TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO fin_budgets (category, amount, period, notes)
    VALUES (p_category, p_amount, LOWER(p_period), p_notes)
    ON CONFLICT (category, period)
        DO UPDATE SET amount = EXCLUDED.amount, notes = EXCLUDED.notes;
END;
$$;
```

## 3. `sp_fin_expense_summary`

Returns category totals, budget variance, and transaction counts for dashboard summaries.

```sql
CREATE OR REPLACE FUNCTION sp_fin_expense_summary(
    p_from DATE,
    p_to   DATE
)
RETURNS TABLE (
    category          TEXT,
    total_amount      NUMERIC(14, 2),
    transaction_count BIGINT,
    budget_amount     NUMERIC(14, 2),
    variance          NUMERIC(14, 2)
)
LANGUAGE sql
AS $$
    SELECT
        t.category,
        SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) AS total_amount,
        COUNT(*) AS transaction_count,
        COALESCE(b.amount, 0) AS budget_amount,
        COALESCE(b.amount, 0) - SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) AS variance
    FROM fin_transactions t
    LEFT JOIN fin_budgets b
        ON b.category = t.category
    WHERE t.event_date BETWEEN p_from AND p_to
    GROUP BY t.category, b.amount
    ORDER BY total_amount DESC;
$$;
```

## 4. `sp_fin_investment_insight`

Calculates rolling averages for savings and investment categories to feed recommendation logic.

```sql
CREATE OR REPLACE FUNCTION sp_fin_investment_insight(
    p_months INTEGER DEFAULT 6
)
RETURNS TABLE (
    period_label TEXT,
    total_amount NUMERIC(14, 2)
)
LANGUAGE sql
AS $$
    SELECT
        to_char(date_trunc('month', event_date), 'YYYY-MM') AS period_label,
        SUM(t.amount) AS total_amount
    FROM fin_transactions t
    WHERE t.category IN ('Investments', 'Savings')
      AND t.event_date >= (current_date - (INTERVAL '1 month' * (p_months - 1)))
    GROUP BY date_trunc('month', event_date)
    ORDER BY period_label;
$$;
```

### Operational Notes

- **Idempotency**: `sp_fin_import_transaction` protects against duplicate imports using wallet or bank-provided identifiers.
- **Analytics windows**: The summary and insight functions accept dynamic date ranges so API endpoints can reuse them for ad-hoc reporting.
- **Extension points**: Additional procedures can be layered for custom KPI tracking (e.g., savings rate) without changing application code.

These stored procedures should be executed as part of your database migration process so the API can switch from the default in-memory store to a durable persistence layer whenever required.
