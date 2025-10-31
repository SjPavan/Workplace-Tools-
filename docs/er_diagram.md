# Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ DEVICES : owns
    USERS ||--o{ CALENDARS : manages
    USERS ||--o{ PROJECTS : leads
    USERS ||--o{ TASKS : creates
    USERS ||--o{ ROUTINES : plans
    USERS ||--o{ HABITS : tracks
    USERS ||--o{ HABIT_LOGS : records
    USERS ||--o{ MOOD_LOGS : logs
    USERS ||--o{ SCRAPING_JOBS : schedules
    USERS ||--o{ AI_INTERACTION_LOGS : interacts
    USERS ||--o{ FINANCIAL_ACCOUNTS : maintains
    USERS ||--o{ FINANCIAL_TRANSACTIONS : categorises
    USERS ||--o{ ANALYTICS_SNAPSHOTS : aggregates
    USERS ||--o{ NOTIFICATION_PREFERENCES : configures
    PROJECTS ||--o{ TASKS : organises
    PROJECTS ||--o{ RESEARCH_ASSETS : references
    PROJECTS ||--o{ FINANCIAL_TRANSACTIONS : budgets
    CALENDARS ||--o{ TASKS : schedules
    ROUTINES ||--o{ ROUTINE_TASKS : sequences
    TASKS ||--o{ ROUTINE_TASKS : repeats
    HABITS ||--o{ HABIT_LOGS : measures
    SCRAPING_JOBS ||--o{ EXTRACTION_RESULTS : produces
    TASKS ||--o{ AI_INTERACTION_LOGS : context
    FINANCIAL_ACCOUNTS ||--o{ FINANCIAL_TRANSACTIONS : records
```

## Indexing Highlights

- `tasks` keeps composite indexes on `(user_id, status, due_at)` and `(user_id, start_at)` to accelerate scheduling queries.
- `scraping_jobs` exposes `(status, next_run_at)` and `(user_id, status)` indexes for worker pickup and monitoring.
- Fact tables such as `habit_logs`, `mood_logs`, `extraction_results`, and `financial_transactions` include time-based indexes for analytics-friendly querying.

Render the diagram directly in GitHub (Mermaid is supported) or copy the block into any Mermaid-compatible viewer.
