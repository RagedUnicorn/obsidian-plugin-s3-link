import S3LinkPlugin from "./main";
import Config from "./config";
import { MarkdownView, WorkspaceLeaf } from "obsidian";

const moduleName = "Commands";

export function addPluginCommands(plugin: S3LinkPlugin) {
    addClearLocalCacheCommand(plugin);
    addReloadActiveLeafCommand(plugin);
    addReloadAllOpenPreviewLeafsCommand(plugin);
}

/**
 * Clears the local cache. The command is always visible.
 * 
 * @param plugin 
 */
function addClearLocalCacheCommand(plugin: S3LinkPlugin) {
    console.debug(`${moduleName}::addClearLocalCacheCommand - Adding command`);

    plugin.addCommand({
        id: `${Config.PLUGIN_NAME}-clear-cache}`,
        name: "Clear local cache",
        callback: () => {
            console.debug(
                `${moduleName}::addClearLocalCacheCommand - Clearing local cache`
            );

            plugin.cache.clearCache();
        },
    });
}

/**
 * Reloads the active leaf if it is a preview leaf. The command is only visible if the active leaf is a preview leaf.
 * 
 * @param plugin
 * 
 * @returns boolean
 */
function addReloadActiveLeafCommand(plugin: S3LinkPlugin) {
    console.debug(`${moduleName}::addReloadActiveLeafCommand - Adding command`);

    plugin.addCommand({
        id: `${Config.PLUGIN_NAME}-reload-active-leaf`,
        name: "Reload Active Markdown Preview Leaf",
        checkCallback: (checking: boolean) => {
            // It is not recommend to access the activeLeaf directly but this seems to be the only way to rebuild the view as of right now
            const activeLeaf = plugin.app.workspace.activeLeaf;

            if (
                activeLeaf != null &&
                activeLeaf.view instanceof MarkdownView &&
                (activeLeaf.view as MarkdownView).getMode() === "preview"
            ) {
                if (!checking) {
                    console.debug("Rebuilding active leaf");
                    // @ts-ignore
                    activeLeaf.rebuildView();
                }

                return true;
            }

            return false;
        },
    });
}

/**
 * Reloads all open preview leafs. The command is only visible if there is at least one open preview leaf.
 *
 * @param plugin
 *
 * @returns boolean
 */
function addReloadAllOpenPreviewLeafsCommand(plugin: S3LinkPlugin) {
    console.debug(
        `${moduleName}::addReloadAllOpenPreviewLeafsCommand - Adding command`
    );

    plugin.addCommand({
        id: `${Config.PLUGIN_NAME}-reload-all-open-leafs`,
        name: "Reload All Open Markdown Preview Leafs",
        checkCallback: (checking: boolean) => {
            const markdownLeaves =
                this.app.workspace.getLeavesOfType("markdown");

            if (markdownLeaves.length) {
                if (!checking) {
                    console.debug("Rebuilding all open preview leafs");

                    markdownLeaves.forEach((leaf: WorkspaceLeaf) => {
                        if (leaf.view instanceof MarkdownView) {
                            const markdownView = leaf.view as MarkdownView;

                            if (markdownView.getMode() !== "preview") {
                                return;
                            }
                            // @ts-ignore
                            markdownView.leaf.rebuildView();
                        }
                    });
                }

                return true;
            }

            return false;
        },
    });
}
