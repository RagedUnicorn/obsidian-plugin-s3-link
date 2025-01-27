import Config from "../config/config";
import LocalStorageCache from "./localStorageCache";
import S3FileLink from "../core/s3FileLink";
import { normalizeVersionId } from "../utils/normalizeUtils";

/**
 * A class to cache S3 file links in the browser's local storage.
 */
export default class LocalStorageFileLinkCache extends LocalStorageCache {
    protected readonly moduleName = "LocalStorageFileLinkCache";

    constructor(protected vaultName: string) {
        super(Config.S3_FILE_LINKS_CACHE_PATH, vaultName);
    }

    /**
     * Caches a file link in the local storage.
     *
     * @param fileLink - The S3 file link to be cached.
     */
    public cacheFileLink(fileLink: S3FileLink) {
        console.debug(
            `${this.moduleName}::cacheFileLink - Caching file link:`,
            fileLink
        );

        fileLink.versionId = normalizeVersionId(fileLink.versionId);

        this.writeLocalStorage(fileLink);
    }

    /**
     * Retrieves a file link from the cache.
     *
     * @param objectKey
     *
     * @returns a file link if the objectKey is present in the cache, null otherwise
     */
    public findCachedFileLink(objectKey: string): S3FileLink | null {
        const s3CachedItem = this.searchLocalStorage(objectKey);

        if (s3CachedItem) {
            const s3FileLink: S3FileLink = JSON.parse(s3CachedItem);

            console.debug(
                `${this.moduleName}::findCachedFileLink - Found cached file link`,
                s3FileLink
            );

            return s3FileLink;
        }

        console.debug(
            `${this.moduleName}::findCachedFileLink - File link not found in cache`
        );

        return null;
    }

    /**
     * Clears the file link cache.
     */
    public clearFileLinkCache() {
        console.debug(
            `${this.moduleName}::clearFileLinkCache - Clearing file link cache`
        );

        this.clearLocalStorage(this.cachePath);
    }

    /**
     * Deletes a file link from the cache.
     *
     * @param objectKey
     */
    public deleteFileLinkFromCache(objectKey: string) {
        console.debug(
            `${this.moduleName}::deleteFileLinkFromCache - Deleting file link from cache`,
            objectKey
        );

        this.removeItemFromLocalStorage(this.cachePath, objectKey);
    }

    /**
     * Checks if the ttl item of a specific s3FileLink is expired. Expired in this case means
     * that the versionId is rechecked and if necessary updated.
     *
     * @param lastUpdate The lastUpdate timestamp of the cached item
     *
     * @returns true if the ttl of the item is expired and needs to be rechecked, false otherwise
     */
    public isS3FileLinkTTLExpired(lastUpdate: number): boolean {
        return (
            (Date.now() - lastUpdate) / 1000 >
            Config.S3_FILE_LINK_EXPIRATION_TIME_SECONDS
        );
    }
}
