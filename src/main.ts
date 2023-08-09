import { Plugin } from "obsidian";
import Config from "./config";
import Cache from "./cache";
import { S3PostProcessor } from "./s3PostProcessor";
import { PluginSettingsTab } from "./settings/settingsTab";
import {
    PluginSettings,
    DEFAULT_SETTINGS,
    isPluginReadyState,
} from "./settings/settings";
import { addPluginCommands } from "./commands";
import { PluginState } from "./pluginState";
import { StatusBar } from "./ui/statusBar";
import { sendNotification } from "./ui/notification";

export default class S3LinkPlugin extends Plugin {
    private readonly moduleName = "Main";
    cache: Cache;
    settings: PluginSettings;
    pluginState: PluginState;
    statusBar: StatusBar;
    s3PostProcessor: S3PostProcessor;

    async onload() {
        console.info(
            `${this.moduleName}::onload - Loading plugin - ${Config.PLUGIN_NAME}`
        );

        this.statusBar = new StatusBar(this);
        this.setState(PluginState.LOADING);

        await this.loadSettings();
        this.addSettingTab(new PluginSettingsTab(this.app, this));

        this.cache = await new Cache();
        this.setupMarkdownPostProcessor(this.cache);

        addPluginCommands(this);

        if (isPluginReadyState(this.settings)) {
            this.setState(PluginState.READY);
        } else {
            this.setState(PluginState.CONFIG);
        }
    }

    async onunload() {
        console.info(`${this.moduleName}::onunload - Unloading plugin`);
    }

    async loadSettings() {
        console.debug(
            `${this.moduleName}::loadSettings - Loading settings for ${Config.PLUGIN_NAME}`
        );

        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        console.debug(
            `${this.moduleName}::saveSettings - Saving settings for ${Config.PLUGIN_NAME}`
        );

        await this.saveData(this.settings);

        if (isPluginReadyState(this.settings)) {
            this.setState(PluginState.READY);
        } else {
            this.setState(PluginState.CONFIG);
        }

        this.s3PostProcessor.onSettingsChanged(this.settings);
    }

    /**
     *
     * @param cache
     */
    private setupMarkdownPostProcessor(cache: Cache) {
        console.debug(
            `${this.moduleName}::setupMarkdownPostProcessor - Setting up markdown post processor`
        );

        this.s3PostProcessor = new S3PostProcessor(
            this,
            cache,
            this.settings
        );

        this.registerMarkdownPostProcessor(
            this.s3PostProcessor.onMarkdownPostProcessor.bind(
                this.s3PostProcessor
            )
        );
    }

    public setState(state: PluginState, msg = ""): void {
        if (!this.statusBar) {
            throw new Error("Status bar not initialized");
        }

        switch (state) {
            case PluginState.LOADING:
                this.pluginState = PluginState.LOADING;
                this.statusBar.setStatusBarText(
                    msg || "Loading",
                    "lucide-loader"
                );

                break;
            case PluginState.READY:
                this.pluginState = PluginState.READY;
                this.statusBar.setStatusBarText(msg || "Ready", "lucide-check");

                break;
            case PluginState.CONFIG:
                this.pluginState = PluginState.CONFIG;
                this.statusBar.setStatusBarText(
                    msg || "Missing Configuration",
                    "lucide-settings"
                );
                sendNotification(
                    "Plugin is missing configuration - Please check settings"
                );

                break;
            case PluginState.ERROR:
                this.pluginState = PluginState.ERROR;
                this.statusBar.setStatusBarText(
                    msg || "Error State",
                    "lucide-x-circle"
                );

                break;
        }
    }
}
