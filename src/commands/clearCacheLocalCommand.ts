import S3LinkPlugin from "../main";
import Command from "./command";
import { MarkdownView } from "obsidian";
import Config from "../config/config";
import { reloadCurrentView } from "../utils/obsidianViewUtils";
import {
    removeS3LinkPrefixFromSourceUrl,
    getS3LinkPrefixFromSourceUrl,
    findAllObjectKeysInText,
} from "../utils/utils";

/**
 * A command to reset the cache of the current leaf.
 *
 *
 * This command is active in both preview and source mode. It searches for all S3 links in the current leaf
 * and clears the cache for each of them.
 * Once the cache is cleared, the current leaf is reloaded to reflect the changes. In preview mode this will usually
 * trigger the processing of all s3 links again and might fill up the cache with the same links again.
 * In source mode this does not happen as the links are not resolved in source mode.
 *
 */
export default class ResetCacheLocalCommand extends Command {
    protected readonly moduleName = "ResetCacheLocalCommand";
    protected readonly commandId = `${Config.PLUGIN_NAME}-reset-cache-local-command`;
    protected readonly commandName = "Reset Cache of Current Leaf";

    public addCommand(plugin: S3LinkPlugin): void {
        console.debug(`${this.moduleName}::addCommand - Adding command`);

        plugin.addCommand({
            id: this.commandId,
            name: this.commandName,
            checkCallback: (checking: boolean) => {
                const activeMarkdownView =
                    plugin.app.workspace.getActiveViewOfType(MarkdownView);

                if (activeMarkdownView) {
                    if (!checking) {
                        this.executeCommand(plugin, activeMarkdownView);
                    }

                    return true;
                }

                return false;
            },
        });
    }

    protected executeCommand(
        plugin: S3LinkPlugin,
        markdownView: MarkdownView
    ): void {
        const fileContent = markdownView.getViewData();
        const objectKeys = Array.from(findAllObjectKeysInText(fileContent));

        console.debug(
            `${this.moduleName}::executeCommand - Found object keys:`,
            objectKeys
        );

        objectKeys.forEach((key) => {
            const s3LinkPrefix = getS3LinkPrefixFromSourceUrl(key);
            const strippedKey = removeS3LinkPrefixFromSourceUrl(key);

            console.debug(
                `${this.moduleName}::executeCommand - Found link: ${strippedKey}, clearing cache`
            );

            switch (s3LinkPrefix) {
                case Config.S3_FILE_LINK_PREFIX:
                    plugin.localStorageFileLinkCache.deleteFileLinkFromCache(
                        strippedKey
                    );
                    break;

                case Config.S3_SIGNED_LINK_PREFIX:
                    plugin.localStorageSignedLinkCache.deleteSignLinkFromCache(
                        strippedKey
                    );
                    break;

                default:
                    console.warn(
                        `${this.moduleName}::executeCommand - Unrecognized S3 link prefix: ${s3LinkPrefix}`
                    );
                    break;
            }
        });

        reloadCurrentView(markdownView);
    }
}
