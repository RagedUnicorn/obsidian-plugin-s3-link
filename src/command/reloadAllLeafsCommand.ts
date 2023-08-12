import S3LinkPlugin from "src/main";
import Command from "./command";
import Config from "src/config";
import { sendNotification } from "src/ui/notification";

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
				const activeLeaf = plugin.app.workspace.activeLeaf;
	
				if (activeLeaf != null) {
					if (!checking) {
						console.warn("Test");
					}
	
					return true;
				}
	
				return false;
			},
		});
    }

    protected executeCommand(activeLeaf: any): void {
        // @ts-ignore
        activeLeaf.rebuildView();

        sendNotification("Reloaded active leaf");
    }
}
