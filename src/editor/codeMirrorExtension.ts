import { debounce } from "obsidian";

import {
    ViewPlugin,
    ViewUpdate,
    PluginValue,
    EditorView,
} from "@codemirror/view";
import { Extension } from "@codemirror/state";

import S3LinkPlugin from "../main";
import LinkProcessor from "../core/linkProcessor";
import ImageResolver from "../resolvers/imageResolver";
import VideoResolver from "../resolvers/videoResolver";
import AudioResolver from "../resolvers/audioResolver";
import DivEmbedResolver from "../resolvers/divEmbedResolver";
import AnchorPreloadResolver from "../resolvers/anchorPreloadResolver";
import { createLinkClickInterceptor } from "./linkClickInterceptor";

export default class CodeMirrorExtension {
    private readonly moduleName = "CodeMirrorExtension";
    private linkProcessor: LinkProcessor;
    private imageResolver: ImageResolver;
    private videoResolver: VideoResolver;
    private audioResolver: AudioResolver;
    private divEmbedResolver: DivEmbedResolver;
    private anchorPreloadResolver: AnchorPreloadResolver;

    constructor(private plugin: S3LinkPlugin) {
        this.linkProcessor = plugin.linkProcessor;
        this.imageResolver = new ImageResolver();
        this.videoResolver = new VideoResolver();
        this.audioResolver = new AudioResolver();
        this.divEmbedResolver = new DivEmbedResolver();
        this.anchorPreloadResolver = new AnchorPreloadResolver();

        console.info(
            `${this.moduleName}::constructor - CodeMirrorExtension created`
        );
    }

    /**
     * Build CodeMirror extensions for the plugin.
     * These extensions will monitor the editor and intercept S3 link clicks.
     *
     * @returns
     *  Array of CodeMirror extensions
     */
    public createCodeMirrorExtensions(): Extension[] {
        // Create the link click interceptor
        const linkClickInterceptor = createLinkClickInterceptor(
            (objectKey: string, isSigned: boolean) => {
                if (this.plugin.linkClickHandler) {
                    this.plugin.linkClickHandler.onS3LinkClick(objectKey, isSigned);
                }
            }
        );

        // Create the view plugin for monitoring changes
        const viewPlugin = this.createViewPlugin();

        return [linkClickInterceptor, viewPlugin];
    }

    /**
     * Create the view plugin for monitoring editor changes.
     *
     * @returns
     *  The CodeMirror view plugin
     */
    private createViewPlugin(): ViewPlugin<PluginValue> {
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
        this.processAnchorPreloadLinks(update);
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
            this.audioResolver.resolveHtmlElement(htmlElement);

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
            this.divEmbedResolver.resolveHtmlElement(htmlElement);

        console.debug(
            `${this.moduleName}::processDivEmbedLinks - Resolved div embed links`,
            resolvedDivEmbedLinks
        );

        this.linkProcessor.processLinks(resolvedDivEmbedLinks);
    }

    /**
     * Process anchor links for preloading.
     * This triggers downloads for s3: links but doesn't modify the HTML.
     * In editing mode the anchor hrefs are not reliable, so the resolver
     * scans the raw document text instead of the rendered DOM.
     *
     * @param view The CodeMirror editor view
     */
    private async processAnchorPreloadLinks(view: EditorView) {
        const resolvedS3AnchorLinks = this.anchorPreloadResolver.resolveTextContent(
            view.state.doc.toString()
        );

        if (resolvedS3AnchorLinks.objectKeys.size > 0) {
            console.debug(
                `${this.moduleName}::processAnchorPreloadLinks - Preloading ${resolvedS3AnchorLinks.objectKeys.size} S3 files from document text`
            );
            this.linkProcessor.processLinks(resolvedS3AnchorLinks);
        }
    }

    onunload() {
        // No manual cleanup required: the CodeMirror ViewPlugin disconnects its
        // MutationObserver in its own destroy() hook, and registered editor
        // extensions are torn down by Obsidian when the plugin unloads.
    }
}
