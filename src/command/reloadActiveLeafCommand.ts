import S3LinkPlugin from "src/main";
import Command from "./command";
import Config from "src/config";
import { MarkdownView, WorkspaceLeaf } from "obsidian";
import { sendNotification } from "src/ui/notification";

/**
 * Reloads the active leaf if it is a preview leaf. The command is only visible if the active leaf is a preview leaf.
 */
export default class ReloadActiveLeafCommand extends Command {
    protected readonly moduleName = "ReloadActiveLeafCommand";
    protected readonly commandId = `${Config.PLUGIN_NAME}-reload-active-leaf`;
    protected readonly commandName = "Reload Active Markdown Preview Leaf";

    public addCommand(plugin: S3LinkPlugin): void {
        console.debug(`${this.moduleName}::addCommand - Adding command`);

        plugin.addCommand({
            id: this.commandId,
            name: this.commandName,
            checkCallback: (checking: boolean) => {
                const activeLeaf = plugin.app.workspace.activeLeaf;

                if (
                    activeLeaf != null &&
                    activeLeaf.view instanceof MarkdownView &&
                    (activeLeaf.view as MarkdownView).getMode() === "preview"
                ) {
                    if (!checking) {
                        this.executeCommand(activeLeaf);
                    }

                    return true;
                }

                return false;
            },
        });
    }

    protected executeCommand(activeLeaf: WorkspaceLeaf): void {
        // @ts-ignore
        activeLeaf.rebuildView();

        sendNotification("Reloaded active leaf");
    }
}
