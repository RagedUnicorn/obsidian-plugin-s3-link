import { FileSystemAdapter, TFile } from "obsidian";
import Config from "./config";
import S3Link from "./model/s3Link";
import S3SignedLink from "./model/s3SignedLink";
import * as path from "path";
import * as fs from "fs";
import { Readable } from "stream";
import { createWriteStream } from "fs";

export default class Cache {
    private readonly moduleName = "Cache";
    private openStreams: fs.WriteStream[] = [];

    public async init() {
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
        app.vault
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
        stream: Readable
    ): Promise<TFile | void> {
        const fileExtension = path.extname(objectKey);
        const objectPath = `${this.getCachePath()}\\${versionId}${fileExtension}`;

        console.info(
            `${this.moduleName}: Saving object to cache folder: ${objectPath}`
        );

        if (await app.vault.adapter.exists(objectPath)) {
            console.debug(
                `${this.moduleName}: File already exists in cache, returning existing file`
            );
            return app.vault.getAbstractFileByPath(objectPath) as TFile;
        }

        return new Promise((resolve, reject) => {
            const writeStream = createWriteStream(objectPath);
            const cache = this;

            this.addOpenStream(writeStream);

            writeStream.on("finish", function () {
                cache.removeOpenStream(writeStream);
                resolve();
            });
            writeStream.on("error", function () {
                cache.removeOpenStream(writeStream);
                reject();
            });
            stream.on("error", function () {
                cache.removeOpenStream(writeStream);
                reject();
            });
            stream.pipe(writeStream);
        });
    }

    private addOpenStream(stream: fs.WriteStream) {
        this.openStreams.push(stream);
    }

    private removeOpenStream(stream: fs.WriteStream) {
        this.openStreams = this.openStreams.filter((s) => s !== stream);
    }

    public async closeAllOpenStreams() {
        console.debug(
            `${this.moduleName}: Closing all open streams: ${this.openStreams.length}`
        );

        this.openStreams.forEach((stream) => {
            stream.destroy();
        });

        this.openStreams = [];
    }

    /**
     * Writes a new entry for the given objectKey to localStorage.
     * If one already exists, it will be overwritten.
     *
     * @param objectKey
     * @param versionId
     */
    public writeItemToCache(objectKey: string, versionId: string) {
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

            if (this.isS3SignedLinkCacheItemExpired(parsedData.lastUpdate)) {
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
     * Checks if the cache item of a specific s3SignedLink is expired
     *
     * @param lastUpdate The lastUpdate timestamp of the cached item
     *
     * @returns true if the cache item is expired, false otherwise
     */
    private isS3SignedLinkCacheItemExpired(lastUpdate: number): boolean {
        return (
            (Date.now() - lastUpdate) / 1000 >
            Config.S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS
        );
    }

    /**
     * Checks if the cache item of a specific s3Link is expired
     *
     * @param lastUpdate The lastUpdate timestamp of the cached item
     *
     * @returns true if the cache item is expired, false otherwise
     */
    public isS3LinkCacheItemExpired(lastUpdate: number): boolean {
        return (
            (Date.now() - lastUpdate) / 1000 >
            Config.S3_LINK_EXPIRATION_TIME_SECONDS
        );
    }

    /**
     * Retrieves the path to the cache folder
     *
     * @returns the path to the cache folder
     */
    public getCachePath(): string {
        const basePath = (app.vault.adapter as FileSystemAdapter).getBasePath();
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
                `${this.moduleName}: Cache folder does not exist, aborting...`
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

    /**
     * Removing a specific objectKey from both localStorage and the cache folder.
     * It is important to remove the file from the cache folder first, because the localStorage contains the
     * necessary information to find the file in the cache folder.
     *
     * @param objectKey
     */
    public removeItemFromCache(objectKey: string) {
        this.removeItemFromCacheFolder(objectKey);
        this.removeItemFromLocalStorage(objectKey);
    }

    /**
     * Removes a specific objectKey from the cache folder
     *
     * @param objectKey
     * @returns
     */
    private removeItemFromCacheFolder(objectKey: string) {
        console.debug(
            `${this.moduleName}::removeItemFromCacheFolder - Removing ${objectKey} from cache folder`
        );

        const s3Link = this.findItemInCache(objectKey);

        if (!s3Link) {
            console.debug(
                `${this.moduleName}: No cached s3Link found for objectKey ${objectKey}. Nothing to remove from cache folder`
            );
            return;
        }

        const fileName = `${s3Link.versionId}${path.extname(objectKey)}`;
        const filePath = `${this.getCachePath()}\\${fileName}`;

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.debug(
                `${this.moduleName}: Deleted file ${fileName} from cache folder`
            );
        } else {
            console.debug(
                `${this.moduleName}: No file found for ${fileName} - nothing to delete`
            );
        }
    }

    /**
     * Removes a specific objectKey from localStorage
     *
     * @param objectKey
     */
    private removeItemFromLocalStorage(objectKey: string) {
        console.debug(
            `${this.moduleName}::removeItemFromLocalStorage - Removing ${objectKey} from localStorage`
        );

        const localStorageItems = Object.keys(window.localStorage);

        localStorageItems.forEach((key) => {
            if (key === `${Config.PLUGIN_NAME}/${objectKey}`) {
                localStorage.removeItem(key);

                console.debug(
                    `${this.moduleName}: Removed item with key: ${key}`
                );
            }

            if (
                key ===
                `${Config.PLUGIN_NAME}/${Config.S3_SIGNED_LINK_PREFIX}/${objectKey}`
            ) {
                console.debug(
                    `${this.moduleName}: Removed sign item with key: ${key}`
                );
            }
        });
    }
}
