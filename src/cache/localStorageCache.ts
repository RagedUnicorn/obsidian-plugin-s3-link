import Config from "../config";
import S3SignedLink from "../model/s3SignedLink";
import S3FileLink from "../model/s3FileLink";

export default class LocalStorageCache {
    protected readonly moduleName!: string;
    protected readonly cachePath: string;

    constructor(cachePath: string) {
        this.cachePath = cachePath;
    }

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
        window.localStorage.setItem(
            `${Config.PLUGIN_NAME}/${this.cachePath}/${item.objectKey}`,
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
        const s3CachedItem: string | null = window.localStorage.getItem(
            `${Config.PLUGIN_NAME}/${this.cachePath}/${objectKey}`
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
            baseKey = `${Config.PLUGIN_NAME}/${cachePath}`;
        } else {
            baseKey = `${Config.PLUGIN_NAME}`;
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
        console.debug(
            `${this.moduleName}::removeItemFromLocalStorage - Removing ${objectKey} from localStorage`
        );

        const localStorageItems = Object.keys(window.localStorage);

        localStorageItems.forEach((key) => {
            if (key === `${Config.PLUGIN_NAME}/${cachePath}/${objectKey}`) {
                localStorage.removeItem(key);

                console.debug(
                    `${this.moduleName}::removeItemFromLocalStorage - Removed item with key: ${key}`
                );
            }
        });
    }
}
