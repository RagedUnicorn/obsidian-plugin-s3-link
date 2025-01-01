export enum PluginState {
    LOADING, // plugin is loading
    READY, // plugin is ready to be used (requires a valid configuration)
    CONFIG, // plugin is ready but requires configuration
    ERROR, // plugin is in error state
}
