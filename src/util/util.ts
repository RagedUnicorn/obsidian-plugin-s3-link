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
 * @param objectKey The original key
 * @returns The normalized S3 object key
 */
export function normalizeObjectKey(objectKey: string): string {
    return objectKey
        .toLowerCase() // Convert to lowercase
        .replace(/[^a-z0-9\-._ ]/g, "") // Allow safe characters
        .trim() // Trim leading/trailing spaces
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[-.]/g, "_"); // Replace dots and hyphens with underscores
}
