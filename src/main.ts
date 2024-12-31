import { Plugin } from "obsidian";

import { PluginSettings } from "./settings/pluginSettings";
import { DEFAULT_SETTINGS } from "./settings/defaultSettings";
import Config from "./config/config";

import AwsS3Client from "./network/awsS3Client";
import CodeMirrorExtension from "./editor/codeMirrorExtension";
import MarkdownPostProcessor from "./editor/markdownPostProcessor";
import HtmlProcessor from "./core/htmlProcessor";
import { normalizeVaultName } from "./utils/normalizeUtils";

import FileCache from "./cache/fileCache";
import LocalStorageSignedLinkCache from "./cache/localStorageSignedLinkCache";
import LocalStorageFileLinkCache from "./cache/localStorageFileLinkCache";
import DownloadManager from "./network/downloadManager";
import LinkProcessor from "./core/linkProcessor";

/**
 * Entrypoint class for the S3LinkPlugin.
 */
export default class S3LinkPlugin extends Plugin {
    private readonly moduleName = "S3LinkPlugin";
    pluginSettings!: PluginSettings;
    awsS3Client!: AwsS3Client;
    markdownPostProcessor!: MarkdownPostProcessor;
    codeMirrorExtension!: CodeMirrorExtension;
    fileCache!: FileCache;
    htmlProcessor!: HtmlProcessor;
    normalizedVaultName!: string;
    localStorageSignedLinkCache!: LocalStorageSignedLinkCache;
    localStorageFileLinkCache!: LocalStorageFileLinkCache;
    downloadManager!: DownloadManager;
    linkProcessor!: LinkProcessor;

    /**
     * Entrypoint for plugin initialization.
     */
    async onload() {
        try {
            await this.loadSettings();
            await this.setupFileCache();
            this.htmlProcessor = new HtmlProcessor(this.fileCache, this.app);
            this.normalizedVaultName = normalizeVaultName(
                this.app.vault.getName()
            );
            this.setupLocalStorageCache();
            await this.setupAwsS3Client();
            this.setupDownloadManager();
            this.setupLinkProcessor();
            this.registerEditorTools();
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
    }

    /**
     * Load obsidian settings for data.json or fallback to default settings.
     */
    async loadSettings() {
        console.debug(
            `${this.moduleName}::loadSettings - Loading settings for ${Config.PLUGIN_NAME}`
        );

        this.pluginSettings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    /**
     * Setup the AWS S3 client for the plugin.
     */
    private async setupAwsS3Client() {
        this.awsS3Client = new AwsS3Client(this.pluginSettings);
        await this.awsS3Client.init();
    }

    /**
     * Setup the download manager for the plugin.
     */
    private setupDownloadManager() {
        this.downloadManager = new DownloadManager(
            this.awsS3Client,
            this.pluginSettings,
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
            this.pluginSettings,
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

        this.fileCache = new FileCache(this.app);
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
        this.registerEditorExtension(
            this.codeMirrorExtension.createCodeMirrorExtension(this.app)
        );

        console.info(
            `${this.moduleName}::registerPluginCodeMirrorExtension - CodeMirrorExtension registered`
        );
    }
}
