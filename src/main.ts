import { Plugin } from "obsidian";
import Config from "./config";
import { PluginSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { AwsS3Client } from "./network/awsS3Client";
import { CodeMirrorExtension } from "./editor/codeMirrorExtension";
import { MarkdownPostProcessor } from "./editor/markdownPostProcessor";
import FileCache from "./cache/fileCache";
import LocalStorageSignedLinkCache from "./cache/localStorageSignedLinkCache";

/**
 * Entrypoint calss for the S3LinkPlugin.
 */
export default class S3LinkPlugin extends Plugin {
    private readonly moduleName = "S3LinkPlugin";
    pluginSettings: PluginSettings;
    awsS3Client: AwsS3Client;
    markdownPostProcessor: MarkdownPostProcessor;
    codeMirrorExtension: CodeMirrorExtension;
    fileCache: FileCache;
    localStorageSignedLinkCache: LocalStorageSignedLinkCache;

    /**
     * Entrypoint for plugin initialization.
     */
    async onload() {
        try {
            await this.loadSettings();
            this.setupFileCache();
            this.setupLocalStorageCache();
            this.setupAwsS3Client();
            this.registerEditorTools();
        } catch (error) {
            console.error(
                `${this.moduleName}::onload - Error during initialization`,
                error
            );
        }
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
     * Setup local file cache for the plugin.
     */
    private setupFileCache() {
        console.info(
            `${this.moduleName}::setupFileCache - Setting up file cache`
        );

        this.fileCache = new FileCache(this.app);
        this.fileCache.init();

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

        this.localStorageSignedLinkCache = new LocalStorageSignedLinkCache();
        this.localStorageSignedLinkCache.init();

        // TODO do the same for the file cache

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
