# Development

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm

### Setting up

1. **Install Dependencies:**

```bash
npm install
```

2. **Development Mode:** This watches for project changes. After the build finishes, reload Obsidian using the `Reload app without saving` command.

```bash
npm run dev
```

3. **Build for Production:**

```bash
npm run build
```

## Code Quality

### Linting

Run ESLint to check code style:

```bash
npm run lint
```

### Type Checking

Run TypeScript compiler to check for type errors:

```bash
npm run typecheck
```

### Type Coverage

Check type coverage of the codebase:

```bash
npm run type-coverage
```

For strict type coverage (95% minimum):

```bash
npm run type-coverage:strict
```

## Testing

Run all tests:

```bash
npm test
```

Run tests for a specific file:

```bash
npm test -- path/to/test/file.test.ts
```

## DevContainer Support

This project provides a `.devcontainer` for easy setup. It does however not provide any help with setting up ssh or gpg keys up for the devcontainer because this is usually heavily dependent on the system itself.

It is recommended in this case to work within the devcontainer and do commit either in a separate tool locally or switching between local and container within VSCode.

### Open Project in DevContainer

```
CTRL+Shift+P or Cmd+Shift+P

> Dev Containers: Reopen in Container
```

### Open Project Local

```
CTRL+Shift+P or Cmd+Shift+P

> Dev Containers: Reopen Folder Locally
```

## Creating Releases

Releases for this project are automated using GitHub Actions. Here's how it works:

1. **Tagging a Release:** To initiate a new release, you need to create a new git tag. Use the following convention for versioning: `vx.x.x`.

```bash
git tag vx.x.x
```

2. **Pushing the Tag:** After creating the tag, push it to the repository. This will trigger the GitHub Action to create a new release.

```bash
git push --tags
```

3. **GitHub Actions:** Once the tag is pushed, the GitHub Action associated with release creation is automatically invoked. You can view the workflow in the `.github/workflows/release.yaml` directory of the repository.
