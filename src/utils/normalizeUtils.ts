/**
 * Normalizes the version ID by removing leading non-alphanumeric characters.
 *
 * @param versionId The version ID.
 *
 * @returns The normalized version ID.
 */
export function normalizeVersionId(versionId: string): string {
    return versionId.replace(/[^\w]/g, "");
}

/**
 * Normalizes the vault name.
 * - Converts to lowercase
 * - Removes special characters
 * - Replaces spaces with underscores (_)
 *
 * @param vaultName The original vault name
 * @returns The normalized vault name
 */
export function normalizeVaultName(vaultName: string): string {
    return vaultName
        .toLowerCase() // Convert to lowercase
        .replace(/[^a-z0-9_-\s]/g, "") // Remove special characters except spaces
        .trim() // Trim leading/trailing spaces
        .replace(/\s+/g, "_"); // Replace spaces with underscores
}

/**
 * Normalizes a string for use as an S3 object key.
 * - Converts to lowercase
 * - Replaces spaces with underscores (_)
 * - Removes unsupported characters
 *
 * Dots and hyphens are preserved: collapsing them into underscores would
 * cause distinct S3 keys (e.g. "foo_01.02.2025" vs "foo_01_02_2025") to
 * collide on the same cache entry, so renames in S3 would not invalidate
 * the cache.
 *
 * @param objectKey The original key
 * @returns The normalized S3 object key
 */
export function normalizeObjectKey(objectKey: string): string {
    return objectKey
        .toLowerCase() // Convert to lowercase
        .replace(/[^a-z0-9\-._ ]/g, "") // Allow safe characters
        .trim() // Trim leading/trailing spaces
        .replace(/\s+/g, "_"); // Replace spaces with underscores
}

/**
 * Normalizes S3 bucket name for use as a folder name.
 * - Replaces periods with underscores for cross-platform compatibility
 * - S3 bucket names are already lowercase with limited characters
 *
 * @param bucketName The S3 bucket name
 * @returns Normalized folder name safe for all file systems
 */
export function normalizeBucketNameForFolder(bucketName: string): string {
    // S3 bucket names only contain lowercase, numbers, hyphens, and periods
    // Replace periods and hyphens with underscores for consistency and safety
    return bucketName.replace(/[.-]/g, "_");
}
