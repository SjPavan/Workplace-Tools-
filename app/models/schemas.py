"""SQLAlchemy models describing the workspace data domain."""

from __future__ import annotations

import enum
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy.orm import relationship, declared_attr, synonym

from app.database import Base


class UUIDPrimaryKeyMixin:
    """Mixin providing a UUID primary key column."""

    id = sa.Column(
        pg.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=sa.text("gen_random_uuid()"),
    )


class TimestampMixin:
    """Mixin providing created/updated timestamp columns."""

    created_at = sa.Column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now()"),
    )
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now()"),
        onupdate=sa.func.now(),
    )


class JSONMetadataMixin:
    """Mixin providing a JSONB metadata column with reserved-name safe access."""

    metadata_ = sa.Column(
        "metadata",
        pg.JSONB,
        nullable=False,
        server_default=sa.text("'{}'::jsonb"),
    )

    @declared_attr
    def metadata(cls):  # type: ignore[misc]
        return synonym("metadata_")


class TaskStatus(enum.Enum):
    BACKLOG = "backlog"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    CANCELED = "canceled"


class TaskPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ProjectStatus(enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ScrapingJobStatus(enum.Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExtractionResultStatus(enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILURE = "failure"
    PARTIAL = "partial"


class InteractionRole(enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class NotificationChannel(enum.Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"
    WEBHOOK = "webhook"


class FinancialAccountType(enum.Enum):
    CASH = "cash"
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"
    LOAN = "loan"
    CRYPTO = "crypto"
    OTHER = "other"


class TransactionStatus(enum.Enum):
    PENDING = "pending"
    POSTED = "posted"
    CANCELLED = "cancelled"
    FAILED = "failed"


class TransactionDirection(enum.Enum):
    DEBIT = "debit"
    CREDIT = "credit"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email = sa.Column(sa.String(255), nullable=False, unique=True, index=True)
    full_name = sa.Column(sa.String(255), nullable=True)
    avatar_url = sa.Column(sa.String(512), nullable=True)
    timezone = sa.Column(sa.String(64), nullable=True)
    locale = sa.Column(sa.String(32), nullable=True)
    onboarding_completed = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    last_login_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    preferences = sa.Column(pg.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb"))

    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    calendars = relationship("Calendar", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    routines = relationship("Routine", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    habit_logs = relationship("HabitLog", back_populates="user", cascade="all, delete-orphan")
    mood_logs = relationship("MoodLog", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    research_assets = relationship("ResearchAsset", back_populates="user", cascade="all, delete-orphan")
    scraping_jobs = relationship("ScrapingJob", back_populates="user", cascade="all, delete-orphan")
    ai_logs = relationship("AIInteractionLog", back_populates="user", cascade="all, delete-orphan")
    financial_accounts = relationship("FinancialAccount", back_populates="user", cascade="all, delete-orphan")
    financial_transactions = relationship(
        "FinancialTransaction", back_populates="user", cascade="all, delete-orphan"
    )
    analytics_snapshots = relationship(
        "AnalyticsSnapshot", back_populates="user", cascade="all, delete-orphan"
    )
    notification_preferences = relationship(
        "NotificationPreference", back_populates="user", cascade="all, delete-orphan"
    )


class Device(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "devices"
    __table_args__ = (
        sa.UniqueConstraint("user_id", "device_identifier", name="uq_devices_user_device_identifier"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = sa.Column(sa.String(255), nullable=True)
    device_type = sa.Column(sa.String(64), nullable=True)
    platform = sa.Column(sa.String(64), nullable=True)
    device_identifier = sa.Column(sa.String(255), nullable=True)
    push_token = sa.Column(sa.String(512), nullable=True)
    last_seen_at = sa.Column(sa.DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="devices")


class Calendar(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "calendars"
    __table_args__ = (
        sa.UniqueConstraint("user_id", "external_id", name="uq_calendars_user_external_id"),
        sa.Index("ix_calendars_user_is_primary", "user_id", "is_primary"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = sa.Column(sa.String(255), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    timezone = sa.Column(sa.String(64), nullable=True)
    color = sa.Column(sa.String(16), nullable=True)
    source = sa.Column(sa.String(64), nullable=True)
    is_primary = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    external_id = sa.Column(sa.String(255), nullable=True)

    user = relationship("User", back_populates="calendars")
    tasks = relationship("Task", back_populates="calendar")


class Project(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (
        sa.Index("ix_projects_user_status", "user_id", "status"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = sa.Column(sa.String(255), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    status = sa.Column(sa.Enum(ProjectStatus, name="project_status"), nullable=False)
    start_date = sa.Column(sa.Date, nullable=True)
    due_date = sa.Column(sa.Date, nullable=True)
    priority = sa.Column(sa.Integer, nullable=True)

    user = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")
    research_assets = relationship("ResearchAsset", back_populates="project")
    financial_transactions = relationship("FinancialTransaction", back_populates="project")


class Task(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "tasks"
    __table_args__ = (
        sa.Index("ix_tasks_user_status_due", "user_id", "status", "due_at"),
        sa.Index("ix_tasks_user_start", "user_id", "start_at"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    calendar_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("calendars.id", ondelete="SET NULL"),
        nullable=True,
    )
    project_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    title = sa.Column(sa.String(255), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    status = sa.Column(
        sa.Enum(TaskStatus, name="task_status"),
        nullable=False,
        server_default=TaskStatus.BACKLOG.value,
    )
    priority = sa.Column(
        sa.Enum(TaskPriority, name="task_priority"),
        nullable=False,
        server_default=TaskPriority.MEDIUM.value,
    )
    is_all_day = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    start_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    due_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    completed_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    recurrence_rule = sa.Column(sa.String(255), nullable=True)
    estimated_minutes = sa.Column(sa.Integer, nullable=True)
    actual_minutes = sa.Column(sa.Integer, nullable=True)

    user = relationship("User", back_populates="tasks")
    calendar = relationship("Calendar", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    routines = relationship(
        "RoutineTaskAssociation",
        back_populates="task",
    )
    ai_logs = relationship("AIInteractionLog", back_populates="task")


class Routine(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "routines"
    __table_args__ = (
        sa.Index("ix_routines_user_active", "user_id", "is_active"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = sa.Column(sa.String(255), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    timezone = sa.Column(sa.String(64), nullable=True)
    scheduled_days = sa.Column(pg.ARRAY(sa.SmallInteger), nullable=True)
    start_time = sa.Column(sa.Time(timezone=True), nullable=True)
    end_time = sa.Column(sa.Time(timezone=True), nullable=True)
    cadence = sa.Column(sa.String(64), nullable=True)
    is_active = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))

    user = relationship("User", back_populates="routines")
    tasks = relationship(
        "RoutineTaskAssociation",
        back_populates="routine",
        cascade="all, delete-orphan",
    )


class RoutineTaskAssociation(Base):
    __tablename__ = "routine_tasks"
    __table_args__ = (
        sa.PrimaryKeyConstraint("routine_id", "task_id", name="pk_routine_tasks"),
        sa.Index("ix_routine_tasks_routine_order", "routine_id", "position"),
    )

    routine_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("routines.id", ondelete="CASCADE"),
        nullable=False,
    )
    task_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    position = sa.Column(sa.Integer, nullable=False, server_default=sa.text("0"))
    notes = sa.Column(sa.Text, nullable=True)

    routine = relationship("Routine", back_populates="tasks")
    task = relationship("Task", back_populates="routines")


class Habit(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "habits"
    __table_args__ = (
        sa.Index("ix_habits_user_active", "user_id", "is_archived"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = sa.Column(sa.String(255), nullable=False)
    description = sa.Column(sa.Text, nullable=True)
    metric_unit = sa.Column(sa.String(64), nullable=True)
    target_value = sa.Column(sa.Numeric(10, 2), nullable=True)
    cadence = sa.Column(sa.String(64), nullable=True)
    start_date = sa.Column(sa.Date, nullable=True)
    end_date = sa.Column(sa.Date, nullable=True)
    is_archived = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("false"))

    user = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "habit_logs"
    __table_args__ = (
        sa.Index("ix_habit_logs_habit_logged_at", "habit_id", "logged_at"),
    )

    habit_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    logged_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    value = sa.Column(sa.Numeric(10, 2), nullable=True)
    note = sa.Column(sa.Text, nullable=True)

    habit = relationship("Habit", back_populates="logs")
    user = relationship("User", back_populates="habit_logs")


class MoodLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "mood_logs"
    __table_args__ = (
        sa.Index("ix_mood_logs_user_logged_at", "user_id", "logged_at"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    logged_at = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    mood_score = sa.Column(sa.SmallInteger, nullable=False)
    mood_label = sa.Column(sa.String(64), nullable=True)
    energy_level = sa.Column(sa.SmallInteger, nullable=True)
    triggers = sa.Column(pg.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb"))
    notes = sa.Column(sa.Text, nullable=True)

    user = relationship("User", back_populates="mood_logs")


class ResearchAsset(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "research_assets"
    __table_args__ = (
        sa.Index("ix_research_assets_user_project", "user_id", "project_id"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    title = sa.Column(sa.String(255), nullable=False)
    asset_type = sa.Column(sa.String(64), nullable=False)
    url = sa.Column(sa.String(512), nullable=True)
    source = sa.Column(sa.String(128), nullable=True)
    content_excerpt = sa.Column(sa.Text, nullable=True)

    user = relationship("User", back_populates="research_assets")
    project = relationship("Project", back_populates="research_assets")


class ScrapingJob(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "scraping_jobs"
    __table_args__ = (
        sa.Index("ix_scraping_jobs_status_next", "status", "next_run_at"),
        sa.Index("ix_scraping_jobs_user_status", "user_id", "status"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    name = sa.Column(sa.String(255), nullable=False)
    target_url = sa.Column(sa.String(1024), nullable=False)
    schedule_expression = sa.Column(sa.String(128), nullable=True)
    status = sa.Column(
        sa.Enum(ScrapingJobStatus, name="scraping_job_status"),
        nullable=False,
        server_default=ScrapingJobStatus.PENDING.value,
    )
    priority = sa.Column(sa.Integer, nullable=True)
    last_run_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    next_run_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    last_success_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    failure_count = sa.Column(sa.Integer, nullable=False, server_default=sa.text("0"))
    config = sa.Column(pg.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb"))

    user = relationship("User", back_populates="scraping_jobs")
    extraction_results = relationship(
        "ExtractionResult", back_populates="job", cascade="all, delete-orphan"
    )


class ExtractionResult(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "extraction_results"
    __table_args__ = (
        sa.Index("ix_extraction_results_job_created", "job_id", "created_at"),
    )

    job_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("scraping_jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = sa.Column(
        sa.Enum(ExtractionResultStatus, name="extraction_result_status"),
        nullable=False,
        server_default=ExtractionResultStatus.PENDING.value,
    )
    started_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    finished_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    data = sa.Column(pg.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb"))
    error_message = sa.Column(sa.Text, nullable=True)
    source_url = sa.Column(sa.String(1024), nullable=True)

    job = relationship("ScrapingJob", back_populates="extraction_results")


class AIInteractionLog(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "ai_interaction_logs"
    __table_args__ = (
        sa.Index("ix_ai_logs_user_created", "user_id", "created_at"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    task_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
    )
    session_id = sa.Column(sa.String(255), nullable=True, index=True)
    message_role = sa.Column(sa.Enum(InteractionRole, name="interaction_role"), nullable=False)
    channel = sa.Column(sa.String(64), nullable=True)
    content = sa.Column(sa.Text, nullable=False)
    response_time_ms = sa.Column(sa.Integer, nullable=True)

    user = relationship("User", back_populates="ai_logs")
    task = relationship("Task", back_populates="ai_logs")


class FinancialAccount(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "financial_accounts"
    __table_args__ = (
        sa.Index("ix_financial_accounts_user_type", "user_id", "account_type"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = sa.Column(sa.String(255), nullable=False)
    institution = sa.Column(sa.String(255), nullable=True)
    account_type = sa.Column(
        sa.Enum(FinancialAccountType, name="financial_account_type"),
        nullable=False,
        server_default=FinancialAccountType.OTHER.value,
    )
    currency = sa.Column(sa.String(3), nullable=False, server_default=sa.text("'USD'"))
    balance = sa.Column(sa.Numeric(16, 2), nullable=False, server_default=sa.text("0"))
    last_synced_at = sa.Column(sa.DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="financial_accounts")
    transactions = relationship(
        "FinancialTransaction", back_populates="account", cascade="all, delete-orphan"
    )


class FinancialTransaction(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "financial_transactions"
    __table_args__ = (
        sa.Index("ix_financial_transactions_account_date", "account_id", "transaction_date"),
        sa.Index("ix_financial_transactions_user_date", "user_id", "transaction_date"),
        sa.UniqueConstraint("account_id", "external_id", name="uq_financial_transactions_external"),
    )

    account_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("financial_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    transaction_date = sa.Column(sa.DateTime(timezone=True), nullable=False)
    posted_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    amount = sa.Column(sa.Numeric(16, 2), nullable=False)
    currency = sa.Column(sa.String(3), nullable=False, server_default=sa.text("'USD'"))
    status = sa.Column(
        sa.Enum(TransactionStatus, name="transaction_status"),
        nullable=False,
        server_default=TransactionStatus.PENDING.value,
    )
    direction = sa.Column(
        sa.Enum(TransactionDirection, name="transaction_direction"),
        nullable=False,
        server_default=TransactionDirection.DEBIT.value,
    )
    category = sa.Column(sa.String(128), nullable=True)
    merchant = sa.Column(sa.String(255), nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    external_id = sa.Column(sa.String(255), nullable=True)

    account = relationship("FinancialAccount", back_populates="transactions")
    user = relationship("User", back_populates="financial_transactions")
    project = relationship("Project", back_populates="financial_transactions")


class AnalyticsSnapshot(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "analytics_snapshots"
    __table_args__ = (
        sa.UniqueConstraint("user_id", "metric", "snapshot_date", name="uq_analytics_snapshot"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    metric = sa.Column(sa.String(128), nullable=False)
    snapshot_date = sa.Column(sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"))
    value = sa.Column(sa.Numeric(20, 4), nullable=False)
    dimensions = sa.Column(pg.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb"))

    user = relationship("User", back_populates="analytics_snapshots")


class NotificationPreference(UUIDPrimaryKeyMixin, TimestampMixin, JSONMetadataMixin, Base):
    __tablename__ = "notification_preferences"
    __table_args__ = (
        sa.UniqueConstraint("user_id", "channel", name="uq_notification_preferences_user_channel"),
    )

    user_id = sa.Column(
        pg.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    channel = sa.Column(sa.Enum(NotificationChannel, name="notification_channel"), nullable=False)
    is_enabled = sa.Column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    quiet_from = sa.Column(sa.Time(timezone=True), nullable=True)
    quiet_until = sa.Column(sa.Time(timezone=True), nullable=True)
    preferences = sa.Column(pg.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb"))

    user = relationship("User", back_populates="notification_preferences")
