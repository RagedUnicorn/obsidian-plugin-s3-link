FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:16

LABEL maintainer="Michael Wiesendanger <michael.wiesendanger@gmail.com>" \
      version="1.0" \
      description="Devcontainer image for Obsidian Plugin S3 Link" \
      org.label-schema.schema-version="1.0" \
      org.label-schema.name="obsidian-plugin-s3-link" \
      org.label-schema.vcs-url="https://github.com/RagedUnicorn/obsidian-plugin-s3-link" \
      org.label-schema.vcs-ref="main" \
      org.label-schema.vendor="RagedUnicorn"

WORKDIR /workspace

COPY . /workspace

RUN npm install
