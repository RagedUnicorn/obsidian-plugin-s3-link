import { App, normalizePath, FileSystemAdapter } from "obsidian";
import Config from "../config";

export default class FileCache {
    private readonly moduleName = "FileCache";

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
        const cachePath = this.getCachePath();
        try {
            return await this.app.vault.adapter.exists(cachePath);
        } catch (error) {
            console.error(
                `${this.moduleName}::isCacheFolderPresent - Error checking folder`,
                error
            );
            return false;
        }
    }

    /**
     * Retrieves the path to the cache folder.
     *
     * @returns the normalized path to the cache folder
     */
    public getCachePath(): string {
        const basePath = (
            this.app.vault.adapter as FileSystemAdapter
        ).getBasePath();

        const cachePath = normalizePath(`${basePath}/${Config.CACHE_FOLDER}`);

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
            await this.app.vault.createFolder(Config.CACHE_FOLDER);
            console.debug(
                `${this.moduleName}::createCacheFolderInBasePath - Created cache folder ${Config.CACHE_FOLDER}`
            );
        } catch (error) {
            console.error(
                `${this.moduleName}::createCacheFolderInBasePath - Error creating cache folder`,
                error
            );
        }
    }
}
