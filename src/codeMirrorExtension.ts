import { ViewPlugin, ViewUpdate, PluginValue } from "@codemirror/view";
import { App } from "obsidian";
import S3LinkPlugin from "./main";
import ImageResolver from "./resolver/imageResolver";
import { LinkProcessor } from "./LinkProcessor";

export class CodeMirrorExtension {
    private readonly moduleName = "CodeMirrorExtension";
    private linkProcessor: LinkProcessor;
    private imageResolver: ImageResolver;

    constructor(plugin: S3LinkPlugin) {
        this.linkProcessor = new LinkProcessor(plugin.pluginSettings);
        this.imageResolver = new ImageResolver();

        console.info(
            `${this.moduleName}::constructor - CodeMirrorExtension created`
        );
    }

    /**
     * Build a CodeMirror extension for the plugin.
     * This extension will be used to monitor the CodeMirror editor for changes.
     *
     * @param app
     * @returns
     */
    public createCodeMirrorExtension(app: App): ViewPlugin<PluginValue> {
        const updateView = this.updateView.bind(this);
        const moduleName = this.moduleName;

        return ViewPlugin.define((view) => {
            console.debug(
                `${moduleName}::constructor - CodeMirrorExtension created`
            );

            // Set up a MutationObserver to monitor when new images are added to the DOM
            const mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        console.debug(
                            `${moduleName}::mutationObserver - New nodes added to the DOM`
                        );
                    }
                });
            });

            // Start observing the view's DOM for changes
            mutationObserver.observe(view.dom, {
                childList: true,
                subtree: true,
            });

            return {
                update(updatedView: ViewUpdate) {
                    console.debug(
                        `${moduleName}::update - CodeMirrorExtension updated`,
                        updatedView
                    );
                    updateView(updatedView);
                },
                destroy() {
                    // Disconnect the MutationObserver when the plugin is destroyed
                    console.debug(
                        `${moduleName}::destroy - CodeMirrorExtension destroyed`
                    );
                    mutationObserver.disconnect();
                },
            };
        });
    }

    private updateView(update: ViewUpdate) {
        const resolvedS3ImageLinks = this.imageResolver.resolveHtmlElement(
            update.view.dom
        );
        console.log("Resolved S3 image links", resolvedS3ImageLinks);

        this.linkProcessor.processLinks(resolvedS3ImageLinks);
    }

    onunload() {
        // Clean up when the plugin is unloaded
        // TODO
    }
}
