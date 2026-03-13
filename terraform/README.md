# Slick Trends Automation — n8n Provider

This directory contains the Terraform configuration to manage your **n8n Workflows** as code using the `pinotelio/n8n` provider.

Instead of manually clicking "Import from File" in the n8n UI, this Terraform script connects to your running n8n instance via API and pushes the local `automation/n8n-workflow.json` directly into the engine and activates it.

## Quick Start

1. Start your n8n instance (e.g., via Docker `docker run -p 5678:5678 n8nio/n8n`)
2. Log into n8n, create an admin account.
3. Go to **Settings -> n8n API** and generate an API key.
4. Create `.tfvars` file:
```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars
```

5. Fill your `terraform.tfvars`:
```hcl
n8n_url     = "http://localhost:5678"
n8n_api_key = "your_n8n_api_key_here"
```

6. Deploy:
```bash
terraform init
terraform apply
```

This will read your `.json` workflow file and automatically create, update, and manage the active workflow inside your n8n server.
