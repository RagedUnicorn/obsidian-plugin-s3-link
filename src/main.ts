import { Plugin } from "obsidian";
import Config from "./config";
import { PluginSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { CodeMirrorExtension } from "./codeMirrorExtension";
import { MarkdownPostProcessor } from "./markdownPostProcessor";

export default class S3LinkPlugin extends Plugin {
    private readonly moduleName = "S3LinkPlugin";
    pluginSettings: PluginSettings;
    markdownPostProcessor: MarkdownPostProcessor;
    codeMirrorExtension: CodeMirrorExtension;

    /**
     * Entrypoint for plugin initialization.
     */
    async onload() {
        try {
            await this.loadSettings();
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
