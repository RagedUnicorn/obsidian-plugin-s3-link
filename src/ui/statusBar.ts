import S3LinkPlugin from "../main";
import Config from "../config";
import { setIcon } from "obsidian";
import { PluginState } from "../pluginState";

export class StatusBar {
    private statusBarItem: HTMLElement;
    private plugin: S3LinkPlugin;

    constructor(plugin: S3LinkPlugin) {
        this.plugin = plugin;
        this.initStatusBar();
    }

    private initStatusBar() {
        this.statusBarItem = this.plugin.addStatusBarItem();
        this.statusBarItem.onclick = this.onStatusBarClick.bind(this);
    }

    public setStatusBarText(msg: string, icon = ""): void {
        if (!this.statusBarItem) {
            throw new Error("Status bar item not initialized");
        }

        const documentFragment = document.createDocumentFragment();

        const textContainer = documentFragment.createEl("span");
        textContainer.style.marginLeft = "5px";
        textContainer.setText(`${Config.PLUGIN_DISPLAY_NAME} - ${msg}`);

        documentFragment.appendChild(textContainer);

        if (icon) {
            const container = documentFragment.createEl("div");
            documentFragment.appendChild(container);
            setIcon(container, icon);
        }

        this.statusBarItem.setText(documentFragment);
    }

    private onStatusBarClick() {
        if (this.plugin.pluginState == PluginState.CONFIG) {
            this.openPluginSettings();
        }
    }

    public openPluginSettings() {
        // @ts-ignore
        this.plugin.app.setting.open();
        // @ts-ignore
        this.plugin.app.setting.openTabById(Config.PLUGIN_NAME);
    }
}
