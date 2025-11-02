"""Initial workspace domain schema."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

# revision identifiers, used by Alembic.
revision = "20241028_01_initial_schema"
down_revision = None
branch_labels = None
depends_on = None

project_status_enum = sa.Enum(
    "planned",
    "active",
    "on_hold",
    "completed",
    "archived",
    name="project_status",
)

task_status_enum = sa.Enum(
    "backlog",
    "scheduled",
    "in_progress",
    "completed",
    "blocked",
    "canceled",
    name="task_status",
)

task_priority_enum = sa.Enum(
    "low",
    "medium",
    "high",
    "critical",
    name="task_priority",
)

scraping_job_status_enum = sa.Enum(
    "pending",
    "scheduled",
    "running",
    "succeeded",
    "failed",
    "cancelled",
    name="scraping_job_status",
)

extraction_result_status_enum = sa.Enum(
    "pending",
    "success",
    "failure",
    "partial",
    name="extraction_result_status",
)

interaction_role_enum = sa.Enum(
    "user",
    "assistant",
    "system",
    "tool",
    name="interaction_role",
)

notification_channel_enum = sa.Enum(
    "email",
    "push",
    "sms",
    "in_app",
    "webhook",
    name="notification_channel",
)

financial_account_type_enum = sa.Enum(
    "cash",
    "checking",
    "savings",
    "credit",
    "investment",
    "loan",
    "crypto",
    "other",
    name="financial_account_type",
)

transaction_status_enum = sa.Enum(
    "pending",
    "posted",
    "cancelled",
    "failed",
    name="transaction_status",
)

transaction_direction_enum = sa.Enum(
    "debit",
    "credit",
    name="transaction_direction",
)


jsonb_empty_object = sa.text("'{}'::jsonb")
jsonb_empty_array = sa.text("'[]'::jsonb")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    bind = op.get_bind()
    project_status_enum.create(bind, checkfirst=True)
    task_status_enum.create(bind, checkfirst=True)
    task_priority_enum.create(bind, checkfirst=True)
    scraping_job_status_enum.create(bind, checkfirst=True)
    extraction_result_status_enum.create(bind, checkfirst=True)
    interaction_role_enum.create(bind, checkfirst=True)
    notification_channel_enum.create(bind, checkfirst=True)
    financial_account_type_enum.create(bind, checkfirst=True)
    transaction_status_enum.create(bind, checkfirst=True)
    transaction_direction_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=True),
        sa.Column("locale", sa.String(length=32), nullable=True),
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("preferences", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "devices",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("device_type", sa.String(length=64), nullable=True),
        sa.Column("platform", sa.String(length=64), nullable=True),
        sa.Column("device_identifier", sa.String(length=255), nullable=True),
        sa.Column("push_token", sa.String(length=512), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_devices_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_devices"),
        sa.UniqueConstraint("user_id", "device_identifier", name="uq_devices_user_device_identifier"),
    )

    op.create_table(
        "calendars",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=True),
        sa.Column("color", sa.String(length=16), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("external_id", sa.String(length=255), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_calendars_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_calendars"),
        sa.UniqueConstraint("user_id", "external_id", name="uq_calendars_user_external_id"),
    )
    op.create_index(
        "ix_calendars_user_is_primary",
        "calendars",
        ["user_id", "is_primary"],
        unique=False,
    )

    op.create_table(
        "projects",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", project_status_enum, nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_projects_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_projects"),
    )
    op.create_index("ix_projects_user_status", "projects", ["user_id", "status"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("calendar_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("project_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", task_status_enum, nullable=False, server_default=sa.text("'backlog'")),
        sa.Column("priority", task_priority_enum, nullable=False, server_default=sa.text("'medium'")),
        sa.Column("is_all_day", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("recurrence_rule", sa.String(length=255), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("actual_minutes", sa.Integer(), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_tasks_user_id_users"),
        sa.ForeignKeyConstraint(["calendar_id"], ["calendars.id"], ondelete="SET NULL", name="fk_tasks_calendar_id_calendars"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL", name="fk_tasks_project_id_projects"),
        sa.PrimaryKeyConstraint("id", name="pk_tasks"),
    )
    op.create_index("ix_tasks_user_status_due", "tasks", ["user_id", "status", "due_at"], unique=False)
    op.create_index("ix_tasks_user_start", "tasks", ["user_id", "start_at"], unique=False)

    op.create_table(
        "routines",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=True),
        sa.Column("scheduled_days", pg.ARRAY(sa.SmallInteger()), nullable=True),
        sa.Column("start_time", sa.Time(timezone=True), nullable=True),
        sa.Column("end_time", sa.Time(timezone=True), nullable=True),
        sa.Column("cadence", sa.String(length=64), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_routines_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_routines"),
    )
    op.create_index("ix_routines_user_active", "routines", ["user_id", "is_active"], unique=False)

    op.create_table(
        "routine_tasks",
        sa.Column("routine_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["routine_id"], ["routines.id"], ondelete="CASCADE", name="fk_routine_tasks_routine_id_routines"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE", name="fk_routine_tasks_task_id_tasks"),
        sa.PrimaryKeyConstraint("routine_id", "task_id", name="pk_routine_tasks"),
    )
    op.create_index(
        "ix_routine_tasks_routine_order",
        "routine_tasks",
        ["routine_id", "position"],
        unique=False,
    )

    op.create_table(
        "habits",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("metric_unit", sa.String(length=64), nullable=True),
        sa.Column("target_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("cadence", sa.String(length=64), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_habits_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_habits"),
    )
    op.create_index("ix_habits_user_active", "habits", ["user_id", "is_archived"], unique=False)

    op.create_table(
        "habit_logs",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("habit_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("logged_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("value", sa.Numeric(10, 2), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["habit_id"], ["habits.id"], ondelete="CASCADE", name="fk_habit_logs_habit_id_habits"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_habit_logs_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_habit_logs"),
    )
    op.create_index(
        "ix_habit_logs_habit_logged_at",
        "habit_logs",
        ["habit_id", "logged_at"],
        unique=False,
    )

    op.create_table(
        "mood_logs",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("logged_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("mood_score", sa.SmallInteger(), nullable=False),
        sa.Column("mood_label", sa.String(length=64), nullable=True),
        sa.Column("energy_level", sa.SmallInteger(), nullable=True),
        sa.Column("triggers", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_array),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_mood_logs_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_mood_logs"),
    )
    op.create_index("ix_mood_logs_user_logged_at", "mood_logs", ["user_id", "logged_at"], unique=False)

    op.create_table(
        "research_assets",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("asset_type", sa.String(length=64), nullable=False),
        sa.Column("url", sa.String(length=512), nullable=True),
        sa.Column("source", sa.String(length=128), nullable=True),
        sa.Column("content_excerpt", sa.Text(), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_research_assets_user_id_users"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL", name="fk_research_assets_project_id_projects"),
        sa.PrimaryKeyConstraint("id", name="pk_research_assets"),
    )
    op.create_index(
        "ix_research_assets_user_project",
        "research_assets",
        ["user_id", "project_id"],
        unique=False,
    )

    op.create_table(
        "scraping_jobs",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("target_url", sa.String(length=1024), nullable=False),
        sa.Column("schedule_expression", sa.String(length=128), nullable=True),
        sa.Column("status", scraping_job_status_enum, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("config", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_scraping_jobs_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_scraping_jobs"),
    )
    op.create_index("ix_scraping_jobs_status_next", "scraping_jobs", ["status", "next_run_at"], unique=False)
    op.create_index("ix_scraping_jobs_user_status", "scraping_jobs", ["user_id", "status"], unique=False)

    op.create_table(
        "extraction_results",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("job_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("status", extraction_result_status_enum, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("data", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("source_url", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["job_id"], ["scraping_jobs.id"], ondelete="CASCADE", name="fk_extraction_results_job_id_scraping_jobs"),
        sa.PrimaryKeyConstraint("id", name="pk_extraction_results"),
    )
    op.create_index(
        "ix_extraction_results_job_created",
        "extraction_results",
        ["job_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "ai_interaction_logs",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("task_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("session_id", sa.String(length=255), nullable=True),
        sa.Column("message_role", interaction_role_enum, nullable=False),
        sa.Column("channel", sa.String(length=64), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="SET NULL", name="fk_ai_interaction_logs_task_id_tasks"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL", name="fk_ai_interaction_logs_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_ai_interaction_logs"),
    )
    op.create_index("ix_ai_logs_user_created", "ai_interaction_logs", ["user_id", "created_at"], unique=False)
    op.create_index("ix_ai_interaction_logs_session_id", "ai_interaction_logs", ["session_id"], unique=False)

    op.create_table(
        "financial_accounts",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("institution", sa.String(length=255), nullable=True),
        sa.Column("account_type", financial_account_type_enum, nullable=False, server_default=sa.text("'other'")),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'USD'")),
        sa.Column("balance", sa.Numeric(16, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_financial_accounts_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_financial_accounts"),
    )
    op.create_index(
        "ix_financial_accounts_user_type",
        "financial_accounts",
        ["user_id", "account_type"],
        unique=False,
    )

    op.create_table(
        "financial_transactions",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("account_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("transaction_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("amount", sa.Numeric(16, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'USD'")),
        sa.Column("status", transaction_status_enum, nullable=False, server_default=sa.text("'pending'")),
        sa.Column("direction", transaction_direction_enum, nullable=False, server_default=sa.text("'debit'")),
        sa.Column("category", sa.String(length=128), nullable=True),
        sa.Column("merchant", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("external_id", sa.String(length=255), nullable=True),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["account_id"], ["financial_accounts.id"], ondelete="CASCADE", name="fk_financial_transactions_account_id_financial_accounts"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL", name="fk_financial_transactions_project_id_projects"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_financial_transactions_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_financial_transactions"),
        sa.UniqueConstraint("account_id", "external_id", name="uq_financial_transactions_external"),
    )
    op.create_index(
        "ix_financial_transactions_account_date",
        "financial_transactions",
        ["account_id", "transaction_date"],
        unique=False,
    )
    op.create_index(
        "ix_financial_transactions_user_date",
        "financial_transactions",
        ["user_id", "transaction_date"],
        unique=False,
    )

    op.create_table(
        "analytics_snapshots",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=True),
        sa.Column("metric", sa.String(length=128), nullable=False),
        sa.Column("snapshot_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("value", sa.Numeric(20, 4), nullable=False),
        sa.Column("dimensions", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("metadata", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_analytics_snapshots_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_analytics_snapshots"),
        sa.UniqueConstraint("user_id", "metric", "snapshot_date", name="uq_analytics_snapshot"),
    )

    op.create_table(
        "notification_preferences",
        sa.Column("id", pg.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", pg.UUID(as_uuid=True), nullable=False),
        sa.Column("channel", notification_channel_enum, nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("quiet_from", sa.Time(timezone=True), nullable=True),
        sa.Column("quiet_until", sa.Time(timezone=True), nullable=True),
        sa.Column("preferences", pg.JSONB(astext_type=sa.Text()), nullable=False, server_default=jsonb_empty_object),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", name="fk_notification_preferences_user_id_users"),
        sa.PrimaryKeyConstraint("id", name="pk_notification_preferences"),
        sa.UniqueConstraint("user_id", "channel", name="uq_notification_preferences_user_channel"),
    )


def downgrade() -> None:
    op.drop_table("notification_preferences")
    op.drop_table("analytics_snapshots")
    op.drop_index("ix_financial_transactions_user_date", table_name="financial_transactions")
    op.drop_index("ix_financial_transactions_account_date", table_name="financial_transactions")
    op.drop_table("financial_transactions")
    op.drop_index("ix_financial_accounts_user_type", table_name="financial_accounts")
    op.drop_table("financial_accounts")
    op.drop_index("ix_ai_interaction_logs_session_id", table_name="ai_interaction_logs")
    op.drop_index("ix_ai_logs_user_created", table_name="ai_interaction_logs")
    op.drop_table("ai_interaction_logs")
    op.drop_index("ix_extraction_results_job_created", table_name="extraction_results")
    op.drop_table("extraction_results")
    op.drop_index("ix_scraping_jobs_user_status", table_name="scraping_jobs")
    op.drop_index("ix_scraping_jobs_status_next", table_name="scraping_jobs")
    op.drop_table("scraping_jobs")
    op.drop_index("ix_research_assets_user_project", table_name="research_assets")
    op.drop_table("research_assets")
    op.drop_index("ix_mood_logs_user_logged_at", table_name="mood_logs")
    op.drop_table("mood_logs")
    op.drop_index("ix_habit_logs_habit_logged_at", table_name="habit_logs")
    op.drop_table("habit_logs")
    op.drop_index("ix_habits_user_active", table_name="habits")
    op.drop_table("habits")
    op.drop_index("ix_routine_tasks_routine_order", table_name="routine_tasks")
    op.drop_table("routine_tasks")
    op.drop_index("ix_routines_user_active", table_name="routines")
    op.drop_table("routines")
    op.drop_index("ix_tasks_user_start", table_name="tasks")
    op.drop_index("ix_tasks_user_status_due", table_name="tasks")
    op.drop_table("tasks")
    op.drop_index("ix_projects_user_status", table_name="projects")
    op.drop_table("projects")
    op.drop_index("ix_calendars_user_is_primary", table_name="calendars")
    op.drop_table("calendars")
    op.drop_table("devices")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    transaction_direction_enum.drop(op.get_bind(), checkfirst=True)
    transaction_status_enum.drop(op.get_bind(), checkfirst=True)
    financial_account_type_enum.drop(op.get_bind(), checkfirst=True)
    notification_channel_enum.drop(op.get_bind(), checkfirst=True)
    interaction_role_enum.drop(op.get_bind(), checkfirst=True)
    extraction_result_status_enum.drop(op.get_bind(), checkfirst=True)
    scraping_job_status_enum.drop(op.get_bind(), checkfirst=True)
    task_priority_enum.drop(op.get_bind(), checkfirst=True)
    task_status_enum.drop(op.get_bind(), checkfirst=True)
    project_status_enum.drop(op.get_bind(), checkfirst=True)
