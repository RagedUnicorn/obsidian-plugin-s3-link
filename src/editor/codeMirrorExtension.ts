import { App } from "obsidian";
import { debounce } from "obsidian";

import {
    ViewPlugin,
    ViewUpdate,
    PluginValue,
    EditorView,
} from "@codemirror/view";

import S3LinkPlugin from "../main";
import { isEditorModeSource } from "../util/editorHelper";
import LinkProcessor from "../editor/linkProcessor";
import ImageResolver from "../resolver/imageResolver";
import VideoResolver from "../resolver/videoResolver";
import AudioResolver from "../resolver/audioResolver";
import DivEmbedResolver from "../resolver/divEmbedResolver";

export default class CodeMirrorExtension {
    private readonly moduleName = "CodeMirrorExtension";
    private linkProcessor: LinkProcessor;
    private imageResolver: ImageResolver;
    private videoResolver: VideoResolver;
    private AudioResolver: AudioResolver;
    private DivEmbedResolver: DivEmbedResolver;

    constructor(private plugin: S3LinkPlugin) {
        this.linkProcessor = new LinkProcessor(
            plugin.fileCache,
            plugin.localStorageSignedLinkCache,
            plugin.localStorageFileLinkCache,
            plugin.pluginSettings,
            plugin.awsS3Client
        );
        this.imageResolver = new ImageResolver();
        this.videoResolver = new VideoResolver();
        this.AudioResolver = new AudioResolver();
        this.DivEmbedResolver = new DivEmbedResolver();

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
        const updateView = this.throttleUpdateView.bind(this);
        const moduleName = this.moduleName;

        return ViewPlugin.define((view) => {
            console.debug(
                `${moduleName}::constructor - CodeMirrorExtension created`
            );

            // Set up a MutationObserver to monitor when new nodes are added to the DOM
            const mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        /**
                         * Skip the update if the editor mode is not source. Let the MarkdownPostProcessor handle the preview mode.
                         */
                        if (!isEditorModeSource(app)) {
                            console.info(
                                `${moduleName}::mutationObserver - Editor mode is not source. Skipping update`
                            );
                            return;
                        }

                        console.debug(
                            `${moduleName}::mutationObserver - New nodes added to the DOM`
                        );
                        updateView(view);
                    }
                });
            });

            mutationObserver.observe(view.dom, {
                childList: true,
                subtree: true,
            });

            return {
                update(updatedView: ViewUpdate) {
                    /**
                     * Skip the update if the editor mode is not source. Let the MarkdownPostProcessor handle the preview mode.
                     * Note: Source can also mean plain text mode and will still invoke the CodeMirror extension. There will however
                     * be no rendered HTML content to process and thus no updates will be made.
                     */
                    if (!isEditorModeSource(app)) {
                        console.info(
                            `${moduleName}::update - Editor mode is not source. Skipping update`
                        );
                        return;
                    }

                    console.debug(
                        `${moduleName}::update - CodeMirrorExtension updated`,
                        updatedView
                    );
                    updateView(updatedView.view);
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

    /**
     * Throttle the update view function to prevent multiple calls in quick succession.
     */
    private throttleUpdateView = debounce(
        this.updateView.bind(this),
        100,
        false
    );

    /**
     * Update the view with the processed content.
     *
     * @param update
     */
    private async updateView(update: EditorView) {
        console.debug(
            `${this.moduleName}::updateView - Processing rendered html content`
        );

        this.processImageLinks(update.dom);
        this.processVideoLinks(update.dom);
        this.processAudioLinks(update.dom);
        this.processDivEmbedLinks(update.dom);
    }

    /**
     * Process and update image links in the view.
     *
     * @param htmlElement - The HTML element to process
     */
    private async processImageLinks(htmlElement: HTMLElement) {
        const resolvedS3ImageLinks =
            this.imageResolver.resolveHtmlElement(htmlElement);

        console.debug(
            `${this.moduleName}::processImageLinks - Resolved S3 image links`,
            resolvedS3ImageLinks
        );

        this.linkProcessor.processLinks(resolvedS3ImageLinks);
    }

    /**
     * Process and update video links in the view.
     *
     * @param htmlElement - The HTML element to process
     */
    private async processVideoLinks(htmlElement: HTMLElement) {
        const resolvedS3VideoLinks =
            this.videoResolver.resolveHtmlElement(htmlElement);

        console.debug(
            `${this.moduleName}::processVideoLinks - Resolved S3 video links`,
            resolvedS3VideoLinks
        );

        this.linkProcessor.processLinks(resolvedS3VideoLinks);
    }

    /**
     * Process and update audio links in the view.
     *
     * @param htmlElement - The HTML element to process
     */
    private async processAudioLinks(htmlElement: HTMLElement) {
        const resolvedS3AudioLinks =
            this.AudioResolver.resolveHtmlElement(htmlElement);

        console.debug(
            `${this.moduleName}::processAudioLinks - Resolved S3 audio links`,
            resolvedS3AudioLinks
        );

        this.linkProcessor.processLinks(resolvedS3AudioLinks);
    }

    /**
     * Process and update div embed links in the view.
     *
     * @param htmlElement - The HTML element to process
     */
    private async processDivEmbedLinks(htmlElement: HTMLElement) {
        const resolvedDivEmbedLinks =
            this.DivEmbedResolver.resolveHtmlElement(htmlElement);

        console.debug(
            `${this.moduleName}::processDivEmbedLinks - Resolved div embed links`,
            resolvedDivEmbedLinks
        );

        this.linkProcessor.processLinks(resolvedDivEmbedLinks);
    }

    onunload() {
        // Clean up when the plugin is unloaded
        // TODO
    }
}
