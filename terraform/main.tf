terraform {
  required_version = ">= 1.5.0"

  required_providers {
    n8n = {
      source  = "pinotelio/n8n"
      version = "~> 0.1.0" # Use a compatible community provider version
    }
  }
}

provider "n8n" {
  url     = var.n8n_url
  api_key = var.n8n_api_key
}

# ══════════════════════════════════════════════════════════════════════════════
#  n8n Terraform Provider — Manage Workflows as Code
# ══════════════════════════════════════════════════════════════════════════════

locals {
  workflow_json = jsondecode(file("${path.module}/../automation/n8n-workflow.json"))
}

resource "n8n_workflow" "abandoned_cart" {
  name        = local.workflow_json.name
  active      = true
  
  # The provider expects these parts of the JSON as stringified arrays/objects
  nodes       = jsonencode(local.workflow_json.nodes)
  connections = jsonencode(local.workflow_json.connections)
  settings    = jsonencode(local.workflow_json.settings)
}
