import S3LinkPlugin from "./main";
import Config from "./config";

const moduleName = "Commands";

export function addPluginCommands(plugin: S3LinkPlugin) {
    addClearLocalCacheCommand(plugin);
    addReloadLeafCommand(plugin);
}

function addClearLocalCacheCommand(plugin: S3LinkPlugin) {
    console.debug(`${moduleName}::addClearLocalCacheCommand - Adding command`);

    plugin.addCommand({
        id: `${Config.PLUGIN_NAME}-clear-cache}`,
        name: "Clear local cache",
        callback: () => {
            console.debug("Invoked clear cache command");
            plugin.cache.clearCache();
        },
    });
}

function addReloadLeafCommand(plugin: S3LinkPlugin) {
    console.debug(`${moduleName}::addReloadLeafCommand - Adding command`);

    plugin.addCommand({
        id: `${Config.PLUGIN_NAME}-reload-leaf`,
        name: "Reload page",
        callback: async () => {
            // It is not recommend to access the activeLeaf directly but this seems to be the only way to rebuild the view as of right now
            const activeLeaf = plugin.app.workspace.activeLeaf;

            if (activeLeaf != null) {
                // @ts-ignore
                activeLeaf.rebuildView();
            }
        },
    });
}
