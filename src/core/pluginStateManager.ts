import { PluginState } from "../core/pluginState";
import { PluginSettings } from "../settings/pluginSettings";
import S3LinkPlugin from "../main";
import Config from "../config/config";
import { DEFAULT_SETTINGS } from "../settings/defaultSettings";

export default class PluginStateManager {
    private readonly moduleName = "PluginStateManager";
    private pluginState: PluginState = PluginState.LOADING;
    private pluginSettings: PluginSettings = DEFAULT_SETTINGS as PluginSettings;
    private isInitialized = false;

    // observers
    private stateObservers: ((state: PluginState) => void)[] = [];
    private settingsObservers: ((settings: PluginSettings) => void)[] = [];

    constructor(private plugin: S3LinkPlugin) {}

    /**
     * Asynchronous initializer to load settings and evaluate state.
     */
    public async initialize(): Promise<void> {
        console.debug(
            `${this.moduleName}::initialize - Initializing state manager`
        );

        await this.loadSettings();
        this.isInitialized = true;
        this.evaluateState();

        console.debug(
            `${this.moduleName}::initialize - Initialization complete`
        );
    }

    /**
     * Subscribe to state changes.
     */
    public subscribeToState(observer: (state: PluginState) => void): void {
        this.stateObservers.push(observer);
    }

    /**
     * Subscribe to settings changes.
     */
    public subscribeToSettings(
        observer: (settings: PluginSettings) => void
    ): void {
        this.settingsObservers.push(observer);
    }

    /**
     * Notify all observers about a state change.
     */
    private notifyStateObservers(): void {
        this.stateObservers.forEach((observer) => observer(this.pluginState));
    }

    /**
     * Notify all observers about a settings change.
     */
    private notifySettingsObservers(): void {
        this.settingsObservers.forEach((observer) =>
            observer(this.pluginSettings)
        );
    }

    /**
     * Ensure the plugin state manager has been initialized.
     */
    private ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error(
                `${this.moduleName}::ensureInitialized - PluginStateManager has not been initialized. Call initialize() first.`
            );
        }
    }

    /**
     * Evaluates the plugin state based on current settings.
     */
    public evaluateState() {
        this.ensureInitialized();

        const previousState = this.pluginState;

        if (this.hasValidConfiguration()) {
            this.pluginState = PluginState.READY;
        } else if (this.isConfigurationIncomplete()) {
            this.pluginState = PluginState.CONFIG;
        } else {
            this.pluginState = PluginState.ERROR;
        }

        if (previousState !== this.pluginState) {
            this.notifyStateObservers();
        }
    }

    /**
     * Checks if the current configuration is valid.
     *
     * @returns
     *  True if the configuration is valid.
     *  False if the configuration is invalid.
     */
    private hasValidConfiguration(): boolean {
        return (
            !!this.pluginSettings.region &&
            !!this.pluginSettings.bucketName &&
            !!this.pluginSettings.profile
        );
    }

    /**
     * Checks if the configuration is incomplete but not completely invalid.
     *
     * @returns
     *  True if the configuration is incomplete.
     *  False if the configuration is complete or invalid.
     */
    private isConfigurationIncomplete(): boolean {
        return (
            !!this.pluginSettings.region ||
            !!this.pluginSettings.bucketName ||
            !!this.pluginSettings.profile
        );
    }

    /**
     * Load obsidian settings for data.json or fallback to default settings.
     */
    private async loadSettings() {
        console.debug(
            `${this.moduleName}::loadSettings - Loading settings for ${Config.PLUGIN_NAME}`
        );

        this.pluginSettings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.plugin.loadData()
        ) as PluginSettings;
    }

    /**
     * Update settings and re-evaluate the state.
     */
    public updateSettings(partialSettings: Partial<PluginSettings>) {
        this.ensureInitialized();

        // Merge updated settings with existing settings
        this.pluginSettings = {
            ...this.pluginSettings,
            ...partialSettings,
        };

        this.plugin.saveData(this.pluginSettings);

        this.evaluateState();
        this.notifySettingsObservers();
    }

    /**
     * Get the current plugin settings.
     *
     * @returns The current plugin settings.
     */
    public getSettings(): PluginSettings {
        this.ensureInitialized();

        return this.pluginSettings;
    }

    /**
     * Get the current plugin state.
     *
     * @returns The current plugin state.
     */
    public getState(): PluginState {
        this.ensureInitialized();

        return this.pluginState;
    }
}
