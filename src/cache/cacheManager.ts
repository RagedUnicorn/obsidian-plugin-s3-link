import { App } from "obsidian";
import Config from "../config/config";
import LocalStorageSignedLinkCache from "./localStorageSignedLinkCache";
import LocalStorageFileLinkCache from "./localStorageFileLinkCache";
import { emitter, EVENT_UI_MESSAGE } from "../event/event";

/**
 * Manages all cache operations for the S3 Link plugin.
 * Provides centralized cache management functionality.
 */
export default class CacheManager {
    private readonly moduleName = "CacheManager";

    constructor(
        private app: App,
        private localStorageSignedLinkCache: LocalStorageSignedLinkCache,
        private localStorageFileLinkCache: LocalStorageFileLinkCache
    ) {}

    /**
     * Clears all caches including file cache and localStorage entries.
     * This includes:
     * - The s3_link_cache folder and all its contents
     * - All localStorage entries for this plugin
     */
    public async clearAllCaches(): Promise<void> {
        try {
            // Clear the s3_link_cache folder
            const cacheFolderPath = Config.S3_FILE_LINK_CACHE_FOLDER;
            
            if (await this.app.vault.adapter.exists(cacheFolderPath)) {
                await this.app.vault.adapter.rmdir(cacheFolderPath, true);
                console.info(`${this.moduleName}::clearAllCaches - Deleted ${cacheFolderPath} folder`);
            }

            // Clear all localStorage entries for this plugin
            const keysToRemove: string[] = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(Config.PLUGIN_NAME)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach((key) => {
                localStorage.removeItem(key);
            });

            console.info(`${this.moduleName}::clearAllCaches - Removed ${keysToRemove.length} localStorage entries`);

            // Emit success notification
            emitter.emit(EVENT_UI_MESSAGE, {
                message: "All caches cleared successfully"
            });
        } catch (error) {
            console.error(`${this.moduleName}::clearAllCaches - Error clearing caches`, error);
            
            // Emit error notification
            emitter.emit(EVENT_UI_MESSAGE, {
                message: "Error clearing caches. Please check the console for details."
            });
            
            throw error;
        }
    }

    /**
     * Clears only the file cache (s3_link_cache folder).
     */
    public async clearFileCache(): Promise<void> {
        try {
            const cacheFolderPath = Config.S3_FILE_LINK_CACHE_FOLDER;
            
            if (await this.app.vault.adapter.exists(cacheFolderPath)) {
                await this.app.vault.adapter.rmdir(cacheFolderPath, true);
                console.info(`${this.moduleName}::clearFileCache - Deleted ${cacheFolderPath} folder`);
            }
        } catch (error) {
            console.error(`${this.moduleName}::clearFileCache - Error clearing file cache`, error);
            throw error;
        }
    }

    /**
     * Clears only the localStorage caches.
     */
    public clearLocalStorageCaches(): void {
        try {
            this.localStorageSignedLinkCache.clearSignedLinkCache();
            this.localStorageFileLinkCache.clearFileLinkCache();
            
            console.info(`${this.moduleName}::clearLocalStorageCaches - Cleared localStorage caches`);
        } catch (error) {
            console.error(`${this.moduleName}::clearLocalStorageCaches - Error clearing localStorage caches`, error);
            throw error;
        }
    }
}