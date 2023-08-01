export enum PluginState {
    LOADING, // addon is loading
    READY, // addon is ready to be used (requires a valid configuration)
    CONFIG, // addon is ready but requires configuration
    ERROR, // addon is in error state
}
