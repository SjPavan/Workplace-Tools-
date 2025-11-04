# Terraform Variables for Deployment Infrastructure

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
  
  default = "dev"
}

variable "project_name" {
  description = "Base name for all resources"
  type        = string
  default     = "workplace-tools"
}

variable "region" {
  description = "AWS region for Supabase resources"
  type        = string
  default     = "us-east-1"
  
  validation {
    condition     = contains(["us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-west-2", "ap-southeast-1"], var.region)
    error_message = "Region must be a valid AWS region supported by Supabase free tier."
  }
}

variable "enable_oauth_providers" {
  description = "Enable OAuth authentication providers"
  type        = object({
    google  = optional(bool, true)
    github  = optional(bool, false)
    twitter = optional(bool, false)
  })
  default = {
    google  = true
    github  = false
    twitter = false
  }
}

variable "storage_buckets" {
  description = "Storage buckets configuration"
  type        = map(object({
    public    = optional(bool, false)
    file_size_limit = optional(number, 52428800) # 50MB in bytes
  }))
  default = {
    uploads = {
      public = false
    }
    public  = {
      public = true
    }
  }
}

variable "edge_functions" {
  description = "Edge functions to deploy"
  type        = map(object({
    file_path = string
    enabled   = optional(bool, true)
  }))
  default = {
    "health-check" = {
      file_path = "${path.module}/functions/health-check/index.ts"
    }
  }
}

variable "database_extensions" {
  description = "PostgreSQL extensions to enable"
  type        = list(string)
  default = [
    "uuid-ossp",
    "pgcrypto",
    "pg_stat_statements",
    "pg_trgm",
    "btree_gin",
    "btree_gist",
    "citext",
    "pgcrypto",
    "uuid-ossp"
  ]
}

variable "custom_domains" {
  description = "Custom domains for services"
  type        = object({
    api    = optional(string, "")
    web    = optional(string, "")
    worker = optional(string, "")
  })
  default = {
    api    = ""
    web    = ""
    worker = ""
  }
}

variable "rate_limiting" {
  description = "Rate limiting configuration"
  type        = object({
    requests_per_second = optional(number, 100)
    burst_size          = optional(number, 200)
  })
  default = {
    requests_per_second = 100
    burst_size          = 200
  }
}

variable "backup_retention" {
  description = "Database backup retention settings"
  type        = object({
    retention_days = optional(number, 30)
    enabled       = optional(bool, true)
  })
  default = {
    retention_days = 30
    enabled       = true
  }
}

variable "monitoring" {
  description = "Monitoring and alerting configuration"
  type        = object({
    enabled = optional(bool, true)
    alerts = optional(object({
      cpu_utilization    = optional(number, 80)
      memory_utilization = optional(number, 80)
      disk_utilization   = optional(number, 85)
      error_rate         = optional(number, 5)
    }), {})
  })
  default = {
    enabled = true
    alerts = {
      cpu_utilization    = 80
      memory_utilization = 80
      disk_utilization   = 85
      error_rate         = 5
    }
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    "ManagedBy" = "terraform"
    "Project"   = "workplace-tools"
  }
}

variable "enable_cdn" {
  description = "Enable CDN for static assets"
  type        = bool
  default     = true
}

variable "enable_realtime" {
  description = "Enable Supabase Realtime"
  type        = bool
  default     = true
}

variable "enable_vector" {
  description = "Enable Supabase Vector (pgvector extension)"
  type        = bool
  default     = false
}
