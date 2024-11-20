import { App } from "obsidian";
import S3LinkPlugin from "../main";

import { updateSignedLinkReferences } from "./htmlProcessor";
import { isEditorModePreview } from "../util/editorHelper";

import { emitter } from "../event/event";

import { LinkProcessor } from "../editor/linkProcessor";
import ImageResolver from "../resolver/imageResolver";
import VideoResolver from "../resolver/videoResolver";

export class MarkdownPostProcessor {
    private readonly moduleName = "S3PostProcessor";
    private app: App;
    private linkProcessor: LinkProcessor;
    private imageResolver: ImageResolver;
    private videoResolver: VideoResolver;

    constructor(plugin: S3LinkPlugin) {
        this.app = plugin.app;
        this.linkProcessor = new LinkProcessor(
            plugin.localStorageSignedLinkCache,
            plugin.pluginSettings,
            plugin.awsS3Client
        );
        this.imageResolver = new ImageResolver();
        this.videoResolver = new VideoResolver();

        console.info(
            `${this.moduleName}::constructor - MarkdownPostProcessor created`
        );
    }

    /**
     * Callback for the markdown post processor. Invoked when markdown is rendered.
     * Note: This will only trigger in the preview mode and not in the editor mode.
     * Note: The content is dependent on the context and doesn't necessarily contain the whole markdown file.
     *
     * @param element HTMLElement containing the rendered markdown content
     */
    public async onMarkdownPostProcessor(element: HTMLElement) {
        /**
         * MarkdownPostProcessor should only be triggered in preview mode. This is just an additional check to
         * ensure that the processor is only doing work in preview mode.
         */
        if (!isEditorModePreview(this.app)) {
            console.info(
                `${this.moduleName}::onMarkdownPostProcessor - Editor mode is not preview. Skipping update`
            );
            return;
        }

        console.debug(
            `${this.moduleName}::onMarkdownPostProcessor - Processing rendered html content`
        );

        this.processImageLinks(element);
        this.processVideoLinks(element);
    }

    /**
     * Set up event listeners to receive processed links. Processed links are links that
     * where resolved to their respective signed s3 links.
     *
     * TODO add listener for downloaded files (none sign links)
     */
    private setupEventListeners() {
        emitter.on("signLinkProcessed", ({ elements, s3SignedLink }) => {
            console.debug(
                `${this.moduleName} - Signed Link processed:`,
                elements,
                s3SignedLink
            );
            updateSignedLinkReferences(elements, s3SignedLink);
        });
    }

    /**
     * Process and update image links in the view.
     *
     * @param update
     */
    private async processImageLinks(element: HTMLElement) {
        const resolvedS3ImageLinks =
            this.imageResolver.resolveHtmlElement(element);
        console.debug(
            `${this.moduleName}::processImageLinks - Resolved S3 image links`,
            resolvedS3ImageLinks
        );

        this.linkProcessor.processLinks(resolvedS3ImageLinks);
    }

    /**
     * Process and update video links in the view.
     *
     * @param update
     */
    private async processVideoLinks(element: HTMLElement) {
        const resolvedS3VideoLinks =
            this.videoResolver.resolveHtmlElement(element);
        console.debug(
            `${this.moduleName}::processVideoLinks - Resolved S3 video links`,
            resolvedS3VideoLinks
        );

        this.linkProcessor.processLinks(resolvedS3VideoLinks);
    }
}
