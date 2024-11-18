resource "aws_iam_user" "test_user" {
  name = "rg_obsidian_plugin_s3_link_test_user"
  path = "/ragedunicorn_obsidian_plugin/"

  tags = {
    Name        = "rg-obsidian-plugin-s3-link-test-user"
    Description = "RagedUnicorn Obsidian Plugin S3 Link Test User"
  }
}

resource "aws_iam_access_key" "test_user" {
  user = aws_iam_user.test_user.name
}

data "aws_iam_policy_document" "s3_test_user_access_policy" {
  statement {
    sid    = ""
    effect = "Allow"

    actions = [
      "s3:ListBucketVersions",
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]

    resources = [
      "arn:aws:s3:::${var.bucket_name}"
    ]
  }

  statement {
    sid    = ""
    effect = "Allow"

    actions = [
      "s3:GetObjectVersion",
      "s3:GetObject"
    ]

    resources = [
      "arn:aws:s3:::${var.bucket_name}/*"
    ]
  }

  version = "2012-10-17"
}

resource "aws_iam_policy" "test_user_policy" {
  name        = "rg-tf-ragedunicorn-obsidian-plugin-s3-link-test-user-access-policy"
  path        = "/ragedunicorn_obsidian_plugin/"
  description = "RagedUnicorn Obsidian Plugin S3 Link Test User Access Policy"
  policy      = data.aws_iam_policy_document.s3_test_user_access_policy.json

  tags = {
    Name        = "rg-tf-ragedunicorn-obsidian-plugin-s3-link-test-user-access-policy"
    Description = "RagedUnicorn Obsidian Plugin S3 Link Test User Access Policy"
  }
}

resource "aws_iam_user_policy_attachment" "test_user_policy_attach" {
  user       = aws_iam_user.test_user.name
  policy_arn = aws_iam_policy.test_user_policy.arn
}
