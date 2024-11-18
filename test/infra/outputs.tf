output "bucket_arn" {
  description = "The ARN of the created S3 test assets bucket"
  value       = aws_s3_bucket.assets.arn
}

output "iam_arn" {
  description = "The ARN assigned by AWS for this user"
  value       = aws_iam_user.test_user.arn
}

output "iam_name" {
  description = "The users name"
  value       = aws_iam_user.test_user.name
}

output "iam_unique_id" {
  description = "The unique ID assigned by AWS"
  value       = aws_iam_user.test_user.unique_id
}

output "iam_access_key" {
  description = "The AWS access key"
  value       = aws_iam_access_key.test_user.id
}

output "iam_secret_key" {
  description = "The AWS secret key"
  sensitive   = true
  value       = aws_iam_access_key.test_user.secret
}
