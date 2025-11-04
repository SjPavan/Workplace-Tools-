# Terraform Outputs for Deployment Infrastructure

# Supabase Project Outputs
output "supabase_project_id" {
  description = "Supabase project ID"
  value       = supabase_project.main.id
}

output "supabase_project_url" {
  description = "Supabase project URL"
  value       = supabase_project.main.url
}

output "supabase_api_url" {
  description = "Supabase API URL"
  value       = supabase_project.main.api_url
}

output "supabase_database_url" {
  description = "Supabase database connection URL"
  value       = supabase_project.main.database_url
  sensitive   = true
}

# API Keys
output "supabase_anon_key" {
  description = "Supabase anonymous API key"
  value       = supabase_api_key.anon.key
  sensitive   = true
}

output "supabase_service_role_key" {
  description = "Supabase service role API key"
  value       = supabase_api_key.service_role.key
  sensitive   = true
}

# Database Information
output "database_host" {
  description = "Database host"
  value       = supabase_project.main.database_host
}

output "database_port" {
  description = "Database port"
  value       = supabase_project.main.database_port
}

output "database_name" {
  description = "Database name"
  value       = supabase_project.main.database_name
}

output "database_user" {
  description = "Database user"
  value       = supabase_project.main.database_user
}

output "database_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

# Storage Buckets
output "storage_buckets" {
  description = "Storage buckets information"
  value = {
    for bucket in supabase_storage_bucket :
    bucket.id => {
      id     = bucket.id
      public = bucket.public
    }
  }
}

# Edge Functions
output "edge_functions" {
  description = "Edge functions URLs"
  value = {
    for func in supabase_edge_function :
    func.name => "${supabase_project.main.url}/functions/v1/${func.name}"
  }
}

# Environment Configuration
output "environment_config" {
  description = "Environment configuration for services"
  value = {
    environment = var.environment
    project_id  = local.project_id
    region      = var.region
  }
}

# Service URLs (if custom domains are configured)
output "service_urls" {
  description = "Service URLs"
  value = {
    api    = var.custom_domains.api != "" ? "https://${var.custom_domains.api}" : "${supabase_project.main.url}/rest/v1"
    web    = var.custom_domains.web != "" ? "https://${var.custom_domains.web}" : "https://${local.project_id}.vercel.app"
    worker = var.custom_domains.worker != "" ? "https://${var.custom_domains.worker}" : "https://${local.project_id}-worker.up.railway.app"
  }
}

# Authentication Configuration
output "auth_config" {
  description = "Authentication configuration"
  value = {
    site_url      = var.custom_domains.web != "" ? "https://${var.custom_domains.web}" : "https://${local.project_id}.vercel.app"
    redirect_urls = [
      var.custom_domains.web != "" ? "https://${var.custom_domains.web}" : "https://${local.project_id}.vercel.app",
      "${supabase_project.main.url}/auth/v1/callback"
    ]
    oauth_providers = var.enable_oauth_providers
  }
}

# Monitoring and Health
output "health_endpoints" {
  description = "Health check endpoints"
  value = {
    api    = "${var.custom_domains.api != "" ? "https://${var.custom_domains.api}" : supabase_project.main.api_url}/rest/v1/"
    web    = "${var.custom_domains.web != "" ? "https://${var.custom_domains.web}" : "https://${local.project_id}.vercel.app"}/api/health"
    worker = "${var.custom_domains.worker != "" ? "https://${var.custom_domains.worker}" : "https://${local.project_id}-worker.up.railway.app"}/health"
  }
}

# Local Files
output "env_file_path" {
  description = "Path to generated environment file"
  value       = local_file.env_file.filename
}

output "secrets_file_path" {
  description = "Path to generated secrets file"
  value       = local_file.secrets_file.filename
}

# Configuration for Deployment Scripts
output "deployment_config" {
  description = "Configuration for deployment scripts"
  value = {
    supabase = {
      project_id       = supabase_project.main.id
      api_url          = supabase_project.main.api_url
      anon_key         = supabase_api_key.anon.key
      service_role_key = supabase_api_key.service_role.key
      database_url     = supabase_project.main.database_url
    }
    environment = var.environment
    project_name = var.project_name
  }
  sensitive = true
}

# Terraform State
output "terraform_state" {
  description = "Terraform state information"
  value = {
    backend   = "local"
    statefile = "./terraform.tfstate"
  }
}

# Free Tier Usage
output "free_tier_status" {
  description = "Free tier resource usage status"
  value = {
    supabase = {
      plan           = "free"
      database_size  = "500MB"
      bandwidth      = "500MB/month"
      storage        = "1GB"
      edge_functions = "500k invocations/month"
      auth_users     = "50,000"
    }
  }
}

# Next Steps
output "next_steps" {
  description = "Next steps after infrastructure creation"
  value = [
    "1. Review generated environment files",
    "2. Configure OAuth providers in Supabase dashboard",
    "3. Set up custom domains (if applicable)",
    "4. Run deployment scripts for individual services",
    "5. Configure monitoring and alerts",
    "6. Test all service integrations"
  ]
}
