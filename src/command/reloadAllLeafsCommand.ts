import S3LinkPlugin from "src/main";
import Command from "./command";
import Config from "src/config";
import { sendNotification } from "src/ui/notification";
import { MarkdownView, WorkspaceLeaf } from "obsidian";

/**
 * Reloads the active leaf if it is a preview leaf. The command is only visible if the active leaf is a preview leaf.
 */
export default class ReloadAllLeafsCommand extends Command {
    protected readonly moduleName = "ReloadAllLeafsCommand";
    protected readonly commandId = `${Config.PLUGIN_NAME}-reload-all-open-leafs`;
    protected readonly commandName = "Reload All Open Markdown Preview Leafs";

    public addCommand(plugin: S3LinkPlugin): void {
        console.debug(`${this.moduleName}::addCommand - Adding command`);

        plugin.addCommand({
            id: this.commandId,
            name: this.commandName,
            checkCallback: (checking: boolean) => {
                const markdownLeaves =
                    plugin.app.workspace.getLeavesOfType("markdown");

                if (markdownLeaves.length) {
                    if (!checking) {
                        this.executeCommand(markdownLeaves);
                    }

                    return true;
                }
            },
        });
    }

    protected executeCommand(markdownLeaves: WorkspaceLeaf[]): void {
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

        sendNotification("Reloaded all open leaves");
    }
}
