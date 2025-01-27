variable "aws_region" {
  type        = string
  description = <<EOT
        (Optional) AWS region to use for deployment.

        One of https://docs.aws.amazon.com/directoryservice/latest/admin-guide/regions.html

        Default: eu-central-1
    EOT

  default = "eu-central-1"
}

variable "private_bucket_name" {
  type        = string
  description = "Name of the S3 Asset Bucket"

  default = "ragedunicorn-obsidian-plugin-s3-link-test-private-assets"
}

variable "public_bucket_name" {
  type        = string
  description = "Name of the S3 Asset Bucket"

  default = "ragedunicorn-obsidian-plugin-s3-link-test-public-assets"
}
