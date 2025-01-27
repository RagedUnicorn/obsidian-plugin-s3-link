#!/bin/bash

FOLDER_PATH="../test/assets"
S3_PRIVATE_BUCKET="s3://ragedunicorn-obsidian-plugin-s3-link-test-private-assets"
S3_PUBLIC_BUCKET="s3://ragedunicorn-obsidian-plugin-s3-link-test-public-assets"

upload_to_bucket() {
  local bucket="$1"

  find "$FOLDER_PATH" -type f | while read -r file; do
    echo "Uploading $file to $bucket"
    aws s3 cp "$file" "$bucket"
  done
  echo "Upload to $bucket complete."
}

upload_to_bucket "$S3_PRIVATE_BUCKET"
upload_to_bucket "$S3_PUBLIC_BUCKET"
