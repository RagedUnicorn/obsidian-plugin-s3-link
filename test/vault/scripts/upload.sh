#!/bin/bash

FOLDER_PATH="../test/assets"
S3_BUCKET="s3://ragedunicorn-obsidian-plugin-s3-link-test-assets"

for file in "$FOLDER_PATH"/*; do
  if [ -f "$file" ]; then
    echo "Uploading $file to $S3_BUCKET"
    aws s3 cp "$file" "$S3_BUCKET"
  fi
done

echo "Upload complete."
