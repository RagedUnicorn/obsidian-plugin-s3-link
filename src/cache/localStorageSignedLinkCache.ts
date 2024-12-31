import Config from "../config/config";
import LocalStorageCache from "./localStorageCache";
import S3SignedLink from "../core/s3SignedLink";

/**
 * A class to cache s3 signed links in the browser's local storage.
 *
 * This class extends the LocalStorageCache class and provides methods to cache and retrieve signed links.
 * Metadata about the signed link is stored in the local storage and used to determine if the signed link is still valid or
 * if it needs to be regenerated.
 *
 */
export default class LocalStorageSignedLinkCache extends LocalStorageCache {
    protected readonly moduleName = "LocalStorageSignedLinkCache";

    constructor(protected vaultName: string) {
        super(Config.S3_SIGNED_LINKS_CACHE_PATH, vaultName);
    }

    /**
     * Caches a signed link in the local storage.
     *
     * @param signedLink
     */
    public cacheSignedLink(signedLink: S3SignedLink) {
        console.debug(
            `${this.moduleName}::cacheSignedLink - Caching signed link`,
            signedLink
        );

        this.writeLocalStorage(signedLink);
    }

    /**
     * Retrieves a signed link from the cache.
     *
     * @param objectKey
     *
     * @returns a signed link if the objectKey is present in the cache, null otherwise
     */
    public findCachedSignedLink(objectKey: string): S3SignedLink | null {
        const s3CachedItem = this.searchLocalStorage(objectKey);

        if (s3CachedItem) {
            const s3SignedLink: S3SignedLink = JSON.parse(s3CachedItem);

            console.debug(
                `${this.moduleName}::findCachedSignedLink - Found cached signed link`,
                s3SignedLink
            );

            return s3SignedLink;
        }

        console.debug(
            `${this.moduleName}::findCachedSignedLink - Signed link not found in cache`
        );

        return null;
    }

    /**
     * Clears the signed link cache.
     */
    public clearSignedLinkCache() {
        console.debug(
            `${this.moduleName}::clearSignedLinkCache - Clearing signed link cache`
        );

        this.clearLocalStorage(this.cachePath);
    }

    /**
     * Checks if the cache item of a specific s3SignedLink is expired
     *
     * @param lastUpdate The lastUpdate timestamp of the cached item
     *
     * @returns true if the cache item is expired, false otherwise
     */
    public isS3SignedLinkCacheItemExpired(lastUpdate: number): boolean {
        return (
            (Date.now() - lastUpdate) / 1000 >
            Config.S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS
        );
    }
}
