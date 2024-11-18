provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Type         = "rg-generated"
      Organization = "ragedunicorn"
      Environment  = "test"
      ManagedBy    = "Terraform"
      Project-Key  = "tf-rg-obsidian-plugin-s3-link"
    }
  }
}
