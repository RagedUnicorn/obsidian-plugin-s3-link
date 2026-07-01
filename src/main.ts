import { Plugin, TFile } from "obsidian";

import PluginSettingsTab from "./settings/settingsTab";
import PluginStateManager from "./core/pluginStateManager";

import AwsS3Client from "./network/awsS3Client";
import CodeMirrorExtension from "./editor/codeMirrorExtension";
import MarkdownPostProcessor from "./editor/markdownPostProcessor";
import HtmlProcessor from "./core/htmlProcessor";
import { normalizeVaultName } from "./utils/normalizeUtils";

import FileCache from "./cache/fileCache";
import LocalStorageSignedLinkCache from "./cache/localStorageSignedLinkCache";
import LocalStorageFileLinkCache from "./cache/localStorageFileLinkCache";
import CacheManager from "./cache/cacheManager";
import DownloadManager from "./network/downloadManager";
import LinkProcessor from "./core/linkProcessor";
import ResetCacheLocalCommand from "./commands/clearCacheLocalCommand";
import NotificationManager from "./ui/notificationManager";
import LinkClickHandler from "./core/linkClickHandler";
import { emitter, EVENT_DOWNLOAD_FINISHED } from "./event/event";
import { createS3FileLink } from "./core/s3FileLink";

/**
 * Entrypoint class for the S3LinkPlugin.
 */
export default class S3LinkPlugin extends Plugin {
    private readonly moduleName = "S3LinkPlugin";
    pluginStateManager!: PluginStateManager;
    awsS3Client!: AwsS3Client;
    markdownPostProcessor!: MarkdownPostProcessor;
    codeMirrorExtension!: CodeMirrorExtension;
    fileCache!: FileCache;
    htmlProcessor!: HtmlProcessor;
    normalizedVaultName!: string;
    localStorageSignedLinkCache!: LocalStorageSignedLinkCache;
    localStorageFileLinkCache!: LocalStorageFileLinkCache;
    cacheManager!: CacheManager;
    downloadManager!: DownloadManager;
    linkProcessor!: LinkProcessor;
    linkClickHandler!: LinkClickHandler;

    /**
     * Entrypoint for plugin initialization.
     */
    async onload() {
        try {
            await this.setupPluginStateManager();
            this.setupSettingsTap();
            await this.setupFileCache();
            this.htmlProcessor = new HtmlProcessor(this.fileCache, this.app);
            this.normalizedVaultName = normalizeVaultName(
                this.app.vault.getName()
            );
            this.setupLocalStorageCache();
            this.setupCacheManager();
            await this.setupAwsS3Client();
            this.setupDownloadManager();
            this.setupLinkProcessor();
            this.registerEditorTools();
            this.registerPluginCommands();
            this.registerNotificationManager();
            this.registerLinkClickHandler();
        } catch (error) {
            console.error(
                `${this.moduleName}::onload - Error during initialization`,
                error
            );
            throw error;
        }
    }

    /**
     * Entrypoint for plugin unloading.
     */
    async onunload(): Promise<void> {
        console.info(`${this.moduleName}::onunload - Unloading plugin`);

        this.fileCache?.closeAllOpenStreams();
        this.awsS3Client?.unload();
        this.linkClickHandler?.unregister();
    }

    /**
     * Setup the plugin state manager for the plugin.
     */
    private async setupPluginStateManager() {
        this.pluginStateManager = new PluginStateManager(this);
        await this.pluginStateManager.initialize();
    }

    /**
     * Setup the settings tab for the plugin.
     */
    private setupSettingsTap() {
        this.addSettingTab(new PluginSettingsTab(this.app, this));
    }

    /**
     * Setup the AWS S3 client for the plugin.
     */
    private async setupAwsS3Client() {
        this.awsS3Client = new AwsS3Client(this.pluginStateManager);
        await this.awsS3Client.init();
    }

    /**
     * Setup the download manager for the plugin.
     */
    private setupDownloadManager() {
        this.downloadManager = new DownloadManager(
            this.awsS3Client,
            this.localStorageFileLinkCache,
            this.fileCache
        );
    }

    /**
     * Setup the link processor for the plugin.
     */
    private setupLinkProcessor() {
        this.linkProcessor = new LinkProcessor(
            this.fileCache,
            this.localStorageSignedLinkCache,
            this.localStorageFileLinkCache,
            this.awsS3Client,
            this.downloadManager
        );
    }

    /**
     * Setup local file cache for the plugin.
     */
    private async setupFileCache() {
        console.info(
            `${this.moduleName}::setupFileCache - Setting up file cache`
        );

        this.fileCache = new FileCache(this.app, this.pluginStateManager);
        await this.fileCache.init();

        console.info(
            `${this.moduleName}::setupFileCache - File cache setup complete`
        );
    }

    /**
     * Setup local storage cache for signed/file links.
     */
    private setupLocalStorageCache() {
        console.info(
            `${this.moduleName}::setupLocalStorageCache - Setting up local storage cache`
        );

        this.localStorageSignedLinkCache = new LocalStorageSignedLinkCache(
            this.normalizedVaultName
        );
        this.localStorageFileLinkCache = new LocalStorageFileLinkCache(
            this.normalizedVaultName
        );

        console.info(
            `${this.moduleName}::setupLocalStorageCache - Local storage cache setup complete`
        );
    }

    /**
     * Setup the cache manager for the plugin.
     */
    private setupCacheManager() {
        console.info(
            `${this.moduleName}::setupCacheManager - Setting up cache manager`
        );

        this.cacheManager = new CacheManager(
            this.app,
            this.localStorageSignedLinkCache,
            this.localStorageFileLinkCache
        );

        console.info(
            `${this.moduleName}::setupCacheManager - Cache manager setup complete`
        );
    }

    /**
     * Register the editor tools for the plugin. This includes the CodeMirror extension and the MarkdownPostProcessor.
     */
    private registerEditorTools() {
        console.debug(
            `${this.moduleName}::registerEditorTools - Registering editor tools`
        );

        this.registerPluginCodeMirrorExtension();
        this.registerPluginMarkdownPostProcessor();

        console.debug(
            `${this.moduleName}::registerEditorTools - Editor tools registered`
        );
    }

    /**
     * Register the MarkdownPostProcessor for the plugin.
     */
    private registerPluginMarkdownPostProcessor() {
        console.info(
            `${this.moduleName}::registerPluginMarkdownPostProcessor - Registering MarkdownPostProcessor`
        );

        this.markdownPostProcessor = new MarkdownPostProcessor(this);
        this.registerMarkdownPostProcessor(
            this.markdownPostProcessor.onMarkdownPostProcessor.bind(
                this.markdownPostProcessor
            )
        );

        console.info(
            `${this.moduleName}::registerPluginMarkdownPostProcessor - MarkdownPostProcessor registered`
        );
    }

    /**
     * Register the CodeMirror extension for the plugin.
     */
    private registerPluginCodeMirrorExtension() {
        console.info(
            `${this.moduleName}::registerPluginCodeMirrorExtension - Registering CodeMirrorExtension`
        );

        this.codeMirrorExtension = new CodeMirrorExtension(this);
        const extensions = this.codeMirrorExtension.createCodeMirrorExtensions();
        extensions.forEach(ext => this.registerEditorExtension(ext));

        console.info(
            `${this.moduleName}::registerPluginCodeMirrorExtension - CodeMirrorExtension registered`
        );
    }

    /**
     * Register the plugin commands.
     */
    private registerPluginCommands() {
        console.info(
            `${this.moduleName}::registerPluginCommands - Registering plugin commands`
        );

        new ResetCacheLocalCommand().addCommand(this);

        console.info(
            `${this.moduleName}::registerPluginCommands - Plugin commands registered`
        );
    }

    private registerNotificationManager() {
        new NotificationManager();
        console.info(
            `${this.moduleName}::registerNotificationManager - Notification manager registered`
        );
    }

    /**
     * Register the link click handler for S3 protocol links.
     */
    private registerLinkClickHandler() {
        console.info(
            `${this.moduleName}::registerLinkClickHandler - Registering link click handler`
        );

        this.linkClickHandler = new LinkClickHandler(
            this,
            async (objectKey: string, isSigned: boolean) => {
                // Handle S3 link click
                console.debug(
                    `${this.moduleName}::registerLinkClickHandler - Processing S3 link:`,
                    { objectKey, isSigned }
                );

                if (isSigned) {
                    // For signed links, get the signed URL and open in browser
                    console.info(
                        `${this.moduleName}::registerLinkClickHandler - Opening signed link in browser:`,
                        objectKey
                    );
                    try {
                        const signedUrl =
                            await this.awsS3Client.getSignedUrlForObject(
                                objectKey
                            );
                        if (signedUrl) {
                            window.open(signedUrl, "_blank");
                        }
                    } catch (error) {
                        console.error(
                            `${this.moduleName}::registerLinkClickHandler - Error getting signed URL:`,
                            error
                        );
                    }
                } else {
                    // For file links, download and open in Obsidian
                    try {
                        // Check if file exists in cache
                        const cachedFileLink =
                            this.localStorageFileLinkCache.findCachedFileLink(
                                objectKey
                            );
                        if (
                            cachedFileLink &&
                            (await this.fileCache.fileExistsInCacheFolder(
                                cachedFileLink.objectKey,
                                cachedFileLink.versionId
                            ))
                        ) {
                            const filePath =
                                await this.fileCache.getFileFromCacheFolder(
                                    cachedFileLink
                                );
                            // Open the file in Obsidian
                            await this.openFileInObsidian(filePath);
                        } else {
                            // File not in cache, need to download first
                            const versionId =
                                await this.awsS3Client.getLatestObjectVersion(
                                    objectKey
                                );
                            if (versionId) {
                                // Add to download queue and open after download
                                this.downloadManager.addNewDownLoad(
                                    objectKey,
                                    versionId,
                                    []
                                );

                                // Listen for download completion
                                const downloadListener = async (event: { record: { objectKey: string; versionId: string } }) => {
                                    if (event.record.objectKey === objectKey) {
                                        const fileLink = createS3FileLink(
                                            event.record.objectKey,
                                            event.record.versionId
                                        );
                                        const filePath =
                                            await this.fileCache.getFileFromCacheFolder(
                                                fileLink
                                            );
                                        await this.openFileInObsidian(
                                            filePath
                                        );
                                        // Remove listener after handling
                                        emitter.off(
                                            EVENT_DOWNLOAD_FINISHED,
                                            downloadListener
                                        );
                                    }
                                };
                                emitter.on(
                                    EVENT_DOWNLOAD_FINISHED,
                                    downloadListener
                                );
                            }
                        }
                    } catch (error) {
                        console.error(
                            `${this.moduleName}::registerLinkClickHandler - Error processing file link:`,
                            error
                        );
                    }
                }
            }
        );

        this.linkClickHandler.register();

        console.info(
            `${this.moduleName}::registerLinkClickHandler - Link click handler registered`
        );
    }

    /**
     * Open a file in Obsidian.
     * Opens the cached file as a regular Obsidian file in a new tab/pane.
     */
    private async openFileInObsidian(filePath: string) {
        try {
            // Extract the actual file path from app:// URL if present
            let actualPath = filePath;
            if (filePath.startsWith('app://')) {
                // Parse the URL to extract the actual file path
                // Format: app://[id]/[actual_path]?[timestamp]
                const urlParts = filePath.split('/');
                // Skip 'app:' and the ID parts, rejoin the rest
                actualPath = urlParts.slice(3).join('/');
                // Remove any query parameters
                const queryIndex = actualPath.indexOf('?');
                if (queryIndex > -1) {
                    actualPath = actualPath.substring(0, queryIndex);
                }
                // On Windows, fix the drive letter format (C:/ instead of C/)
                if (actualPath.match(/^[A-Za-z]\//)) {
                    actualPath = actualPath.substring(0, 1) + ':' + actualPath.substring(1);
                }
            }
            
            // Get the relative path from the vault root
            const vaultPath = ((this.app.vault.adapter as unknown as { basePath?: string }).basePath || '').replace(/\\/g, '/');
            
            // Normalize the actual path to use forward slashes
            const normalizedActualPath = actualPath.replace(/\\/g, '/');
            
            let relativePath = normalizedActualPath;
            
            // If the file path is absolute and within the vault, make it relative
            if (normalizedActualPath.toLowerCase().startsWith(vaultPath.toLowerCase())) {
                relativePath = normalizedActualPath.substring(vaultPath.length);
                if (relativePath.startsWith('/')) {
                    relativePath = relativePath.substring(1);
                }
            }

            console.debug(
                `${this.moduleName}::openFileInObsidian - Opening file:`,
                { filePath, actualPath, relativePath, vaultPath }
            );

            // Check if the file exists in the vault
            const file = this.app.vault.getAbstractFileByPath(relativePath);

            if (file) {
                // Open the file in a new leaf (tab)
                const leaf = this.app.workspace.getLeaf("tab");
                await leaf.openFile(file as TFile);
            } else {
                console.warn(
                    `${this.moduleName}::openFileInObsidian - File not found in vault, trying direct open:`,
                    relativePath
                );
                // Try to open using the path directly
                await this.app.workspace.openLinkText(relativePath, "", true);
            }
        } catch (error) {
            console.error(
                `${this.moduleName}::openFileInObsidian - Error opening file:`,
                error
            );
            // Fallback: try to open as external file
            window.open(filePath);
        }
    }

}
