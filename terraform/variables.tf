variable "n8n_url" {
  description = "The base URL of your n8n instance (e.g., https://n8n.yourdomain.com)"
  type        = string
}

variable "n8n_api_key" {
  description = "An API key generated from your n8n instance (Settings -> n8n API)"
  type        = string
  sensitive   = true
}
