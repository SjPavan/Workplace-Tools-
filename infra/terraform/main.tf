terraform {
  required_version = ">= 1.0"
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 0.7"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
  
  backend "local" {
    path = "./terraform.tfstate"
  }
}

provider "supabase" {
  # Supabase provider configuration
  # Credentials will be sourced from environment variables:
  # SUPABASE_ACCESS_TOKEN
  # SUPABASE_DB_PASSWORD
}

# Variables
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Base project name"
  type        = string
  default     = "workplace-tools"
}

variable "region" {
  description = "AWS region for Supabase"
  type        = string
  default     = "us-east-1"
}

# Local values
locals {
  project_id = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Supabase Project
resource "supabase_project" "main" {
  name        = local.project_id
  db_password = random_password.db_password.result
  region      = var.region
  
  # Free tier settings
  db_version     = "15.1.0.88"
  cloud_provider = "aws"
  
  tags = local.common_tags
}

# Supabase Database
resource "supabase_database" "main" {
  project_id = supabase_project.main.id
  
  # Enable required extensions
  extensions = [
    "uuid-ossp",
    "pgcrypto",
    "pg_stat_statements",
    "pg_trgm"
  ]
}

# Supabase Storage Buckets
resource "supabase_storage_bucket" "uploads" {
  id        = "uploads"
  project_id = supabase_project.main.id
  public    = false
}

resource "supabase_storage_bucket" "public" {
  id        = "public"
  project_id = supabase_project.main.id
  public    = true
}

# Supabase Auth Configuration
resource "supabase_auth_settings" "main" {
  project_id = supabase_project.main.id
  
  # Enable email authentication
  enable_email_signup = true
  
  # OAuth providers (configure as needed)
  external_oauth_providers = {
    google = {
      enabled = true
      # These will need to be configured manually in Supabase dashboard
    }
  }
}

# Supabase Edge Functions
resource "supabase_edge_function" "health_check" {
  project_id = supabase_project.main.id
  name       = "health-check"
  file_path  = "${path.module}/functions/health-check/index.ts"
}

resource "supabase_edge_function" "webhook_handler" {
  project_id = supabase_project.main.id
  name       = "webhook-handler"
  file_path  = "${path.module}/functions/webhook-handler/index.ts"
}

# Supabase Functions (Database Functions)
resource "supabase_function" "update_timestamp" {
  project_id = supabase_project.main.id
  name       = "update_timestamp"
  schema     = "public"
  body       = file("${path.module}/sql/update_timestamp.sql")
}

# Database Migrations
resource "supabase_migration" "initial_schema" {
  project_id = supabase_project.main.id
  name       = "001_initial_schema"
  file_path  = "${path.module}/migrations/001_initial_schema.sql"
}

# API Keys
resource "supabase_api_key" "anon" {
  project_id = supabase_project.main.id
  name       = "anon_key"
}

resource "supabase_api_key" "service_role" {
  project_id = supabase_project.main.id
  name       = "service_role_key"
}

# Outputs
output "supabase_project_id" {
  description = "Supabase project ID"
  value       = supabase_project.main.id
}

output "supabase_api_url" {
  description = "Supabase API URL"
  value       = supabase_project.main.api_url
}

output "supabase_anon_key" {
  description = "Supabase anonymous key"
  value       = supabase_api_key.anon.key
  sensitive   = true
}

output "supabase_service_role_key" {
  description = "Supabase service role key"
  value       = supabase_api_key.service_role.key
  sensitive   = true
}

output "supabase_db_url" {
  description = "Supabase database URL"
  value       = supabase_project.main.database_url
  sensitive   = true
}

output "supabase_db_password" {
  description = "Supabase database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "project_url" {
  description = "Supabase project URL"
  value       = supabase_project.main.url
}

# Local file outputs for configuration
resource "local_file" "env_file" {
  content = templatefile("${path.module}/templates/.env.tmpl", {
    SUPABASE_PROJECT_ID       = supabase_project.main.id
    SUPABASE_API_URL          = supabase_project.main.api_url
    SUPABASE_ANON_KEY         = supabase_api_key.anon.key
    SUPABASE_SERVICE_ROLE_KEY = supabase_api_key.service_role.key
    DATABASE_URL             = supabase_project.main.database_url
    ENVIRONMENT              = var.environment
  })
  filename = "${path.cwd}/../config/environments/.env.${var.environment}"
}

resource "local_file" "secrets_file" {
  content = templatefile("${path.module}/templates/secrets.yaml.tmpl", {
    DATABASE_URL = supabase_project.main.database_url
    DB_PASSWORD  = random_password.db_password.result
    PROJECT_ID   = supabase_project.main.id
  })
  filename = "${path.cwd}/../config/secrets/secrets.${var.environment}.yaml"
}
