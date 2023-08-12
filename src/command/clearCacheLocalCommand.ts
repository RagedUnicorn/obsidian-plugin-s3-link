import S3LinkPlugin from "src/main";
import Command from "./command";
import { MarkdownView } from "obsidian";
import Config from "src/config";
import ImageResolver from "src/resolver/imageResolver";
import VideoResolver from "src/resolver/videoResolver";
import SpanResolver from "src/resolver/spanResolver";
import AnchorResolver from "src/resolver/anchorResolver";
import { sendNotification } from "src/ui/notification";

// TODO need to implement the difference between preview and edit mode
// in preview mode we have actual html elements to resolve
// in edit mode we have to resolve the markdown content
export default class ClearCacheLocalCommand extends Command {
    protected readonly moduleName = "ClearCacheLocalCommand";
    protected readonly commandId = `${Config.PLUGIN_NAME}-clear-cache-local-command`;
    protected readonly commandName = "Clear Cache of Current Leaf";

    public addCommand(plugin: S3LinkPlugin): void {
        console.debug(`${this.moduleName}::addCommand - Adding command`);

        plugin.addCommand({
            id: this.commandId,
            name: this.commandName,
            checkCallback: (checking: boolean) => {
                const activeLeaf = plugin.app.workspace.activeLeaf;

                if (
                    activeLeaf != null &&
                    activeLeaf.view instanceof MarkdownView
                ) {
                    if (!checking) {
                        this.executeCommand(
                            plugin,
                            activeLeaf.view as MarkdownView
                        );
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
        const imageResolver = new ImageResolver();
        const videoResolver = new VideoResolver();
        const spanResolver = new SpanResolver();
        const anchorResolver = new AnchorResolver();

        let objectKeys: string[] = [];

        objectKeys = [
            ...imageResolver.findAllObjectKeysInElement(markdownView.contentEl),
            ...videoResolver.findAllObjectKeysInElement(markdownView.contentEl),
            ...spanResolver.findAllObjectKeysInElement(markdownView.contentEl),
            ...anchorResolver.findAllObjectKeysInElement(
                markdownView.contentEl
            ),
        ];

        for (let index = 0; index < objectKeys.length; index++) {
            const element = objectKeys[index];

            console.debug(
                `Found link: ${element} should clear cache for that link`
            );

            plugin.cache.removeItemFromCache(element);
        }

        sendNotification(`Cleared cache of current leaf`);
    }
}
