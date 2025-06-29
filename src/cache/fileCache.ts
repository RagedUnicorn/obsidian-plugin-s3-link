import { App, normalizePath, FileSystemAdapter, TFile } from "obsidian";

import * as path from "path";
import * as fs from "fs";
import { Readable } from "stream";

import Config from "../config/config";
import S3FileLink from "../core/s3FileLink";
import {
    normalizeVersionId,
    normalizeBucketNameForFolder,
} from "../utils/normalizeUtils";
import PluginStateManager from "../core/pluginStateManager";

export default class FileCache {
    private readonly moduleName = "FileCache";
    private openStreams: fs.WriteStream[] = [];

    constructor(
        private app: App,
        private pluginStateManager: PluginStateManager
    ) {}

    /**
     * Initializes the file cache by ensuring the cache folder exists.
     */
    public async init(): Promise<void> {
        try {
            // Create main cache folder if needed
            if (!(await this.isCacheFolderPresent())) {
                console.info(
                    `${this.moduleName}::init - Creating cache folder`
                );
                await this.createCacheFolderInBasePath();
            }

            // Create bucket-specific folder
            const bucketCachePath = this.getRelativeBucketCachePath();
            if (!(await this.pathExists(bucketCachePath))) {
                console.info(
                    `${this.moduleName}::init - Creating bucket cache folder: ${bucketCachePath}`
                );
                await this.app.vault.createFolder(bucketCachePath);
            }
        } catch (error) {
            console.error(
                `${this.moduleName}::init - Error during initialization`,
                error
            );
        }
    }

    /**
     * Checks if the cache folder is present in the root of the vault.
     *
     * @returns true if the cache folder is present, false otherwise
     */
    private async isCacheFolderPresent(): Promise<boolean> {
        const cachePath = this.getRelativeCachePath();
        return this.pathExists(cachePath);
    }

    /**
     * Retrieves the relative path to the cache folder.
     *
     * @returns the normalized relative path to the cache folder
     */
    private getRelativeCachePath(): string {
        const cachePath = normalizePath(`${Config.S3_FILE_LINK_CACHE_FOLDER}`);

        console.debug(
            `${this.moduleName}::getCachePath - Cache path: ${cachePath}`
        );

        return cachePath;
    }

    /**
     * Retrieves the relative path to the bucket-specific cache folder.
     *
     * @returns the normalized relative path to the bucket cache folder
     */
    private getRelativeBucketCachePath(): string {
        const bucketName = this.pluginStateManager.getSettings().bucketName;
        const normalizedBucketName = normalizeBucketNameForFolder(bucketName);
        const cachePath = normalizePath(
            `${Config.S3_FILE_LINK_CACHE_FOLDER}/${normalizedBucketName}`
        );

        console.debug(
            `${this.moduleName}::getRelativeBucketCachePath - Bucket cache path: ${cachePath}`
        );

        return cachePath;
    }

    /**
     * Retrieves the full path to the bucket-specific cache folder.
     *
     * @returns the normalized full path to the bucket cache folder
     */
    private getFullBucketCachePath(): string {
        const basePath = (
            this.app.vault.adapter as FileSystemAdapter
        ).getBasePath();

        const bucketName = this.pluginStateManager.getSettings().bucketName;
        const normalizedBucketName = normalizeBucketNameForFolder(bucketName);

        const cachePath = normalizePath(
            `${basePath}/${Config.S3_FILE_LINK_CACHE_FOLDER}/${normalizedBucketName}`
        );

        console.debug(
            `${this.moduleName}::getFullBucketCachePath - Full bucket cache path: ${cachePath}`
        );

        return cachePath;
    }

    /**
     * Generates the cached filename based on objectKey and versionId.
     * For versioned files: "versionId_filename.ext"
     * For non-versioned files: "filename.ext"
     *
     * @param objectKey The S3 object key
     * @param versionId The S3 object version ID
     * @returns The filename to use in the cache
     */
    private getCachedFileName(objectKey: string, versionId: string): string {
        const fileName = path.basename(objectKey);

        if (versionId && versionId !== "null") {
            const normalizedVersionId = normalizeVersionId(versionId);
            return `${normalizedVersionId}_${fileName}`;
        } else {
            return fileName;
        }
    }

    /**
     * Creates the cache folder in the root of the vault.
     */
    private async createCacheFolderInBasePath(): Promise<void> {
        try {
            await this.app.vault.createFolder(Config.S3_FILE_LINK_CACHE_FOLDER);
            console.debug(
                `${this.moduleName}::createCacheFolderInBasePath - Created cache folder ${Config.S3_FILE_LINK_CACHE_FOLDER}`
            );
        } catch (error) {
            console.error(
                `${this.moduleName}::createCacheFolderInBasePath - Error creating cache folder`,
                error
            );
        }
    }

    /**
     *
     * Saves a file to the cache folder.
     *
     * @param objectKey
     * @param versionId
     * @param stream
     * @returns
     */
    public async saveFileToCacheFolder(
        objectKey: string,
        versionId: string,
        stream: Readable
    ): Promise<void> {
        const cachedFileName = this.getCachedFileName(objectKey, versionId);
        const objectPath = normalizePath(
            `${this.getFullBucketCachePath()}/${cachedFileName}`
        );

        const writeStream = fs.createWriteStream(objectPath);
        this.addOpenStream(writeStream);

        try {
            await Promise.race([
                new Promise<void>((resolve, reject) => {
                    stream.pipe(writeStream);

                    writeStream.once("finish", resolve);
                    writeStream.once("error", reject);
                    stream.once("error", reject);
                }),
                new Promise<void>((_, reject) => {
                    setTimeout(() => {
                        writeStream.destroy(new Error("Stream write timeout"));
                        reject(new Error("Stream write timeout"));
                    }, Config.S3_FILE_LINK_DOWNLOAD_TIMEOUT || 30000);
                }),
            ]);

            console.debug(
                `${this.moduleName}::saveFileToCacheFolder - File saved successfully`
            );
        } catch (error) {
            console.error(
                `${this.moduleName}::saveFileToCacheFolder - Error saving file to cache`,
                error
            );
            throw error;
        } finally {
            this.removeOpenStream(writeStream);
            if (!writeStream.destroyed) {
                writeStream.destroy();
            }
        }
    }

    /**
     * Adds an open stream to the list of open streams.
     *
     * @param stream - The WriteStream to add.
     */
    private addOpenStream(stream: fs.WriteStream) {
        this.openStreams.push(stream);
    }

    /**
     * Removes an open stream from the list of open streams.
     *
     * @param stream - The WriteStream to remove.
     */
    private removeOpenStream(stream: fs.WriteStream) {
        this.openStreams = this.openStreams.filter((s) => s !== stream);
    }

    /**
     * Closes all open streams.
     */
    public async closeAllOpenStreams() {
        console.debug(
            `${this.moduleName}::closeAllOpenStreams - Closing all open streams: ${this.openStreams.length}`
        );

        this.openStreams.forEach((stream) => {
            try {
                if (!stream.destroyed) {
                    stream.destroy();
                    console.info(
                        `${this.moduleName}::closeAllOpenStreams - Stream successfully destroyed`
                    );
                }
            } catch (error) {
                console.error(
                    `${this.moduleName}::closeAllOpenStreams - Error while destroying stream: ${error}`
                );
            }
        });

        this.openStreams = [];
    }

    /**
     * Retrieves a file from the cache folder.
     *
     * @param s3FileLink
     * @returns the file resource path if it exists
     */
    public async getFileFromCacheFolder(
        s3FileLink: S3FileLink
    ): Promise<string> {
        const cachedFileName = this.getCachedFileName(
            s3FileLink.objectKey,
            s3FileLink.versionId
        );
        // important to use a relative path here
        const bucketCachePath = this.getRelativeBucketCachePath();
        const normalizedPath = normalizePath(
            `${bucketCachePath}/${cachedFileName}`
        );

        return this.getVaultResourcePath(s3FileLink, normalizedPath);
    }

    /**
     * Retrieves the vault resource path for a file.
     *
     * @param s3FileLink
     * @param app
     * @returns
     */
    private async getVaultResourcePath(
        s3FileLink: S3FileLink,
        normalizedPath: string
    ): Promise<string> {
        const loadedFile = await this.getAbstractFileWithRetry(
            this.app,
            normalizedPath
        );

        if (loadedFile == null) {
            throw new Error(
                `Failed to retrieve resource path for ${s3FileLink}`
            );
        }

        return this.app.vault.getResourcePath(loadedFile);
    }

    /**
     * Attempts to retrieve an abstract file with retries.
     *
     * @param app - The Obsidian app instance.
     * @param path - The relative path of the file to load.
     * @param retries - The number of retries (default: 10).
     * @param interval - The interval between retries in milliseconds (default: 100).
     *
     * @returns A TFile or null if the file could not be loaded.
     */
    private async getAbstractFileWithRetry(
        app: App,
        path: string,
        retries = 10,
        interval = 100
    ): Promise<TFile | null> {
        for (let i = 0; i < retries; i++) {
            const file = app.vault.getAbstractFileByPath(path);

            if (file) {
                if (file instanceof TFile) {
                    return file as TFile;
                } else {
                    // file can be a TFolder but is not expected here
                    throw new Error(`File is not a TFile: ${file}`);
                }
            }

            await new Promise((res) => setTimeout(res, interval));
        }

        return null;
    }

    /**
     * Checks if a file exists in the cache folder.
     *
     * @param objectKey
     * @param versionId
     * @returns true if the file exists, false otherwise
     */
    public async fileExistsInCacheFolder(
        objectKey: string,
        versionId: string
    ): Promise<boolean> {
        const cachedFileName = this.getCachedFileName(objectKey, versionId);
        const bucketCachePath = this.getRelativeBucketCachePath();
        const normalizedPath = normalizePath(
            `${bucketCachePath}/${cachedFileName}`
        );

        return this.pathExists(normalizedPath);
    }

    /**
     * Checks if a file exists in the cache folder.
     *
     * @param path
     * @returns true if the file exists, false otherwise
     */
    private async pathExists(path: string): Promise<boolean> {
        try {
            return await this.app.vault.adapter.exists(path);
        } catch (error) {
            console.error(
                `${this.moduleName}::pathExists - Error checking path`,
                error
            );
            return false;
        }
    }
}
