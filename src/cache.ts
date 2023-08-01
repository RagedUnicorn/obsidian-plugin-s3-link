import { FileSystemAdapter, TFile } from "obsidian";
import { S3Link } from "./model/s3Link";
import { Config } from "./config";
import * as path from "path";
import * as fs from "fs";
import { S3SignedLink } from "./model/s3SignedLink";

export class Cache {
    private readonly moduleName = "S3Cache";
    private vault = window.app.vault;

    constructor() {
        this.init();
    }

    private async init() {
        const isFolderExisting = await this.isCacheFolderPresent();

        if (!isFolderExisting) {
            console.info(
                `${this.moduleName}: Creating cache folder for the first time`
            );
            this.createCacheFolderInBasePath();
        } else {
            console.info(
                `${this.moduleName}: S3 cache initialization already done`
            );
        }
    }

    /**
     * Checks if the cache folder is present in the root of the vault.
     *
     * @returns true if the cache folder is present, false otherwise
     */
    private async isCacheFolderPresent(): Promise<boolean> {
        try {
            await fs.promises.access(this.getCachePath(), fs.constants.F_OK);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Creates the cache folder in the root of the vault.
     */
    private createCacheFolderInBasePath() {
        this.vault
            .createFolder(Config.CACHE_FOLDER)
            .then(() => {
                console.debug(
                    `${this.moduleName}: Creating cache folder ${Config.CACHE_FOLDER} in root`
                );
            })
            .catch((error) => {
                console.error(
                    `${this.moduleName}: Error creating cache folder`,
                    error
                );
            });
    }

    public async saveFileToCacheFolder(
        objectKey: string,
        versionId: string,
        objectData: Uint8Array
    ): Promise<TFile> {
        const fileExtension = path.extname(objectKey);
        const objectPath = `${Config.CACHE_FOLDER}/${versionId}${fileExtension}`;

        console.info(
            `${this.moduleName}: Saving object to cache folder: ${objectPath}`
        );

        return app.vault.createBinary(objectPath, objectData);
    }

    public initNewItemToCache(objectKey: string, versionId: string) {
        this.writeLocalStorage(objectKey, versionId);
    }

    /**
     * Writes a new entry for the given objectKey to localStorage.
     *
     * @param objectKey The objectKey to write the S3Link for
     * @param versionId The versionId to write to localStorage
     */
    private writeLocalStorage(objectKey: string, versionId: string) {
        const s3Link = new S3Link(objectKey, Date.now(), versionId);

        console.debug(`${this.moduleName}: writeLocalStorage for ${objectKey}`);

        window.localStorage.setItem(
            `${Config.PLUGIN_NAME}/${objectKey}`,
            JSON.stringify(s3Link)
        );
    }

    /**
	 * Retrieves the S3Link object for the given objectKey from localStorage.
	 * 
	 * @param objectKey

	 * @returns a S3Link object if the objectKey is present in the cache, null otherwise
	 */
    public findItemInCache(objectKey: string): S3Link | null {
        console.debug(
            `${this.moduleName}::findItemInCache - Looking for ${objectKey} in cache`
        );

        const s3Link: string | null = window.localStorage.getItem(
            `${Config.PLUGIN_NAME}/${objectKey}`
        );

        if (s3Link) {
            const parsedData = JSON.parse(s3Link);

            console.info(
                `${this.moduleName}: Found s3Link in localStorage`,
                parsedData
            );

            return new S3Link(
                parsedData.objectKey,
                parsedData.lastUpdate,
                parsedData.versionId
            );
        }

        console.info(
            `${this.moduleName}: No cached s3Link found for objectKey ${objectKey}`
        );

        return null;
    }

    /**
     * Writes a new entry for the given objectKey to localStorage.
     *
     * @param objectKey The objectKey to write the signedUrl for
     * @param signedUrl The signedUrl to write to localStorage
     */
    public writeSignedUrlToLocalStorage(objectKey: string, signedUrl: string) {
        console.debug(
            `${this.moduleName}: writeSignedUrlToLocalStorage for ${objectKey}`
        );

        const s3SignedLink = new S3SignedLink(objectKey, Date.now(), signedUrl);

        window.localStorage.setItem(
            `${Config.PLUGIN_NAME}/${Config.S3_SIGNED_LINK_PREFIX}/${objectKey}`,
            JSON.stringify(s3SignedLink)
        );
    }

    /**
     * Retrieves the S3SignedLink object for the given objectKey from localStorage.
     *
     * @param objectKey The objectKey to find the signedUrl for
     * @returns a S3SignedLink object if the objectKey is present in the cache, null otherwise
     */
    public findSignedUrlInCache(objectKey: string): S3SignedLink | null {
        console.debug(
            `${this.moduleName}::findSignedUrlInCache - Looking for ${objectKey} in cache`
        );

        const s3SignLink: string | null = window.localStorage.getItem(
            `${Config.PLUGIN_NAME}/${Config.S3_SIGNED_LINK_PREFIX}/${objectKey}`
        );

        if (s3SignLink) {
            const parsedData = JSON.parse(s3SignLink);

            console.info(
                `${this.moduleName}: Found s3SignLink in localStorage`,
                parsedData
            );

            if (this.isCacheItemExpired(parsedData.lastUpdate)) {
                console.info(
                    `${this.moduleName}: Cache item for ${objectKey} expired, removing from localStorage}`
                );
                window.localStorage.removeItem(
                    `${Config.PLUGIN_NAME}/${Config.S3_SIGNED_LINK_PREFIX}/${objectKey}`
                );
                return null;
            }

            return new S3SignedLink(
                parsedData.objectKey,
                parsedData.lastUpdate,
                parsedData.signedUrl
            );
        }

        console.info(
            `${this.moduleName}: No cached s3SignLink found for objectKey ${objectKey}`
        );

        return null;
    }

    /**
     * Checks if the cache item is expired.
     *
     * @param lastUpdate The lastUpdate timestamp of the cached item
     *
     * @returns true if the cache item is expired, false otherwise
     */
    private isCacheItemExpired(lastUpdate: number): boolean {
        const currentTime = Date.now();
        const timeDifference = currentTime - lastUpdate;

        if (timeDifference / 1000 > Config.S3_LINK_EXPIRATION_TIME_SECONDS) {
            return true;
        }

        return false;
    }

    /**
     * Retrieves the path to the cache folder
     *
     * @returns the path to the cache folder
     */
    public getCachePath(): string {
        const basePath = (
            this.vault.adapter as FileSystemAdapter
        ).getBasePath();
        const cachePath = `${basePath}\\${Config.CACHE_FOLDER}`;

        console.debug(`${this.moduleName}: Cachepath ${cachePath}`);

        return cachePath;
    }

    /**
     * Clears all files from the cache folder and all items from localStorage that are related to the plugin.
     */
    public async clearCache() {
        this.clearCacheFolder();
        this.clearLocalStorage();
    }

    /**
     * Clears all files from the cache folder.
     */
    private async clearCacheFolder() {
        console.debug(
            `${this.moduleName}::clearCacheFolder - Clearing cache folder`
        );

        const cachePath = this.getCachePath();

        if (!fs.existsSync(cachePath)) {
            console.error(
                `${this.moduleName}: Cache folder does not exist, aborting...}`
            );
            return;
        }

        const files = fs.readdirSync(cachePath);

        for (const file of files) {
            const filePath = path.join(cachePath, file);
            const stat = await fs.promises.stat(filePath);

            if (stat.isFile()) {
                await fs.promises.unlink(filePath);
                console.debug(
                    `${this.moduleName}: Deleted file: ${filePath} from cache folder`
                );
            }
        }
    }

    /**
     * Clears all items from localStorage that are related to the plugin.
     */
    private clearLocalStorage() {
        console.debug(
            `${this.moduleName}::clearLocalStorage - Clearing localStorage`
        );

        const localStorageItems = Object.keys(window.localStorage);

        localStorageItems.forEach((key) => {
            if (key.startsWith(Config.PLUGIN_NAME)) {
                localStorage.removeItem(key);

                console.debug(
                    `${this.moduleName}: Removed item with key: ${key}`
                );
            }
        });
    }
}