import { App, normalizePath, FileSystemAdapter, TFile } from "obsidian";

import * as path from "path";
import * as fs from "fs";
import { Readable } from "stream";

import Config from "../config/config";
import S3FileLink from "../core/s3FileLink";
import { normalizeVersionId } from "../utils/normalizeUtils";

export default class FileCache {
    private readonly moduleName = "FileCache";
    private openStreams: fs.WriteStream[] = [];

    constructor(private app: App) {}

    /**
     * Initializes the file cache by ensuring the cache folder exists.
     */
    public async init(): Promise<void> {
        try {
            if (await this.isCacheFolderPresent()) {
                console.info(
                    `${this.moduleName}::init - Cache folder already exists`
                );
            } else {
                console.info(
                    `${this.moduleName}::init - Creating cache folder`
                );
                await this.createCacheFolderInBasePath();
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
     * Retrieves the full path to the cache folder.
     *
     * @returns the normalized full path to the cache folder
     */
    private getFullCachePath(): string {
        const basePath = (
            this.app.vault.adapter as FileSystemAdapter
        ).getBasePath();

        const cachePath = normalizePath(
            `${basePath}/${Config.S3_FILE_LINK_CACHE_FOLDER}`
        );

        console.debug(
            `${this.moduleName}::getCachePath - Cache path: ${cachePath}`
        );

        return cachePath;
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
        const fileExtension = path.extname(objectKey);
        const normalizedVersionId = normalizeVersionId(versionId);
        const objectPath = normalizePath(
            `${this.getFullCachePath()}\\${normalizedVersionId}${fileExtension}`
        ); // full path for writing file

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
     * @param objectKey
     * @param versionId
     * @returns the file if it exists, null otherwise
     */
    public async getFileFromCacheFolder(
        s3FileLink: S3FileLink
    ): Promise<string> {
        const fileExtension = path.extname(s3FileLink.objectKey);
        const normalizedVersionId = normalizeVersionId(s3FileLink.versionId);
        // important to use a relative path here
        const normalizedPath = normalizePath(
            `${Config.S3_FILE_LINK_CACHE_FOLDER}\\${normalizedVersionId}${fileExtension}`
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
        const fileExtension = path.extname(objectKey);
        const normalizedPath = normalizePath(
            `${Config.S3_FILE_LINK_CACHE_FOLDER}\\${versionId}${fileExtension}`
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
