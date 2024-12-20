import Config from "../config";
import S3SignedLink from "../model/s3SignedLink";
import S3FileLink from "../model/s3FileLink";
import { normalizeObjectKey } from "../util/util";

export default class LocalStorageCache {
    protected readonly moduleName!: string;

    constructor(protected cachePath: string, protected vaultName: string) {}

    public async init() {
        console.info(`${this.moduleName}: Initializing local storage cache`);
    }

    /**
     * Writes a new entry for the given objectKey to localStorage.
     *
     * @param objectKey The objectKey to write the S3Link for
     * @param versionId The versionId to write to localStorage
     */
    protected writeLocalStorage(item: S3FileLink | S3SignedLink) {
        const normalizedObjectKey = normalizeObjectKey(item.objectKey);

        console.debug(
            `${this.moduleName}::writeLocalStorage - Writing item "${normalizedObjectKey}" to localStorage`,
            item
        );

        window.localStorage.setItem(
            `${Config.PLUGIN_NAME}/${this.vaultName}/${this.cachePath}/${normalizedObjectKey}`,
            JSON.stringify(item)
        );
    }

    /**
	 * Retrieves the S3Link object for the given objectKey from localStorage.
	 * 
	 * @param objectKey

	 * @returns a S3Link object if the objectKey is present in the cache, null otherwise
	 */
    protected searchLocalStorage(objectKey: string): string | null {
        const normalizedObjectKey = normalizeObjectKey(objectKey);

        console.debug(
            `${this.moduleName}::searchLocalStorage - Searching for ${normalizedObjectKey} in localStorage`
        );

        const s3CachedItem: string | null = window.localStorage.getItem(
            `${Config.PLUGIN_NAME}/${this.vaultName}/${this.cachePath}/${normalizedObjectKey}`
        );

        return s3CachedItem ? s3CachedItem : null;
    }

    /**
     * Clears all items from localStorage that are related to the plugin.
     */
    protected clearLocalStorage(cachePath = "") {
        console.debug(
            `${this.moduleName}::clearLocalStorage - Clearing localStorage`
        );

        let baseKey: string;

        if (cachePath) {
            baseKey = `${Config.PLUGIN_NAME}/${this.vaultName}/${cachePath}`;
        } else {
            baseKey = `${Config.PLUGIN_NAME}/${this.vaultName}`;
        }

        console.info(
            `${this.moduleName}::clearLocalStorage - Clearing cache for baseKey: ${baseKey}`
        );

        const localStorageItems = Object.keys(window.localStorage);

        localStorageItems.forEach((key) => {
            if (key.startsWith(baseKey)) {
                localStorage.removeItem(key);

                console.debug(
                    `${this.moduleName}: Removed item with key: ${key} from localStorage`
                );
            }
        });
    }

    /**
     * Removes an item from localStorage.
     *
     * @param cachePath The cache path to remove the item from
     * @param objectKey The object key to remove from the cache
     */
    protected removeItemFromLocalStorage(cachePath: string, objectKey: string) {
        const normalizedObjectKey = normalizeObjectKey(objectKey);

        console.debug(
            `${this.moduleName}::removeItemFromLocalStorage - Removing ${normalizedObjectKey} from localStorage`
        );

        const localStorageItems = Object.keys(window.localStorage);

        localStorageItems.forEach((key) => {
            if (
                key ===
                `${Config.PLUGIN_NAME}/${this.vaultName}/${cachePath}/${normalizedObjectKey}`
            ) {
                localStorage.removeItem(key);

                console.debug(
                    `${this.moduleName}::removeItemFromLocalStorage - Removed item with key: ${key}`
                );
            }
        });
    }
}
