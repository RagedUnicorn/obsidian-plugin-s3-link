resource "aws_s3_bucket" "private_assets" {
  bucket = var.private_bucket_name

  tags = {
    Name        = "ragedunicorn-obsidian-plugin-s3-link-test-assets"
    Description = "RagedUnicorn Obsidian Plugin S3 Link Test Assets Buckets"
  }
}

resource "aws_s3_bucket_versioning" "private_assets" {
  bucket = aws_s3_bucket.private_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "private_assets" {
  bucket = var.private_bucket_name

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "private_assets" {
  bucket = aws_s3_bucket.private_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "private_assets" {
  bucket = aws_s3_bucket.private_assets.id

  cors_rule {
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket" "public_assets" {
  bucket = var.public_bucket_name

  tags = {
    Name        = "ragedunicorn-obsidian-plugin-s3-link-test-public-assets"
    Description = "RagedUnicorn Obsidian Plugin S3 Link Test Public Assets Buckets"
  }
}

resource "aws_s3_bucket_versioning" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  versioning_configuration {
    status = "Disabled"
  }
}

resource "aws_s3_bucket_public_access_block" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.public_assets.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "public_assets" {
  bucket = aws_s3_bucket.public_assets.id

  cors_rule {
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
