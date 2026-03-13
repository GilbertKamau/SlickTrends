output "workflow_id" {
  description = "The internal ID of the deployed workflow in n8n"
  value       = n8n_workflow.abandoned_cart.id
}

output "setup_instructions" {
  description = "Next steps after apply"
  value       = <<-EOT
    ═══════════════════════════════════════════════════════
    🔁 n8n Workflow Deployed & Synced

    1. Your generic n8n instance was successfully configured.
    2. The local workflow file (automation/n8n-workflow.json) 
       is now synced as an active workflow named:
       Slick Trends — Abandoned Cart Recovery

    Notes:
    If you make changes to the n8n-workflow.json file, just run 
    `terraform apply` again to push those changes to the n8n server.
    ═══════════════════════════════════════════════════════
  EOT
}
