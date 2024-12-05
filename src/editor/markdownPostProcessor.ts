import { App } from "obsidian";

import S3LinkPlugin from "../main";
import { isEditorModePreview } from "../util/editorHelper";
import LinkProcessor from "../editor/linkProcessor";
import ImageResolver from "../resolver/imageResolver";
import VideoResolver from "../resolver/videoResolver";
import AudioResolver from "../resolver/audioResolver";
import SpanEmbedResolver from "../resolver/spanEmbedResolver";

export default class MarkdownPostProcessor {
    private readonly moduleName = "S3PostProcessor";
    private app: App;
    private linkProcessor: LinkProcessor;
    private imageResolver: ImageResolver;
    private videoResolver: VideoResolver;
    private audioResolver: AudioResolver;
    private spanEmbedResolver: SpanEmbedResolver;

    constructor(private plugin: S3LinkPlugin) {
        this.app = plugin.app;
        this.linkProcessor = new LinkProcessor(
            plugin.fileCache,
            plugin.localStorageSignedLinkCache,
            plugin.localStorageFileLinkCache,
            plugin.pluginSettings,
            plugin.awsS3Client
        );
        this.imageResolver = new ImageResolver();
        this.videoResolver = new VideoResolver();
        this.audioResolver = new AudioResolver();
        this.spanEmbedResolver = new SpanEmbedResolver();

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
        this.processAudioLinks(element);
        this.processSpanEmbedLinks(element);
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

    /**
     * Process and update audio links in the view.
     *
     * @param update
     */
    private async processAudioLinks(element: HTMLElement) {
        const resolvedS3AudioLinks =
            this.audioResolver.resolveHtmlElement(element);
        console.debug(
            `${this.moduleName}::processAudioLinks - Resolved S3 audio links`,
            resolvedS3AudioLinks
        );

        this.linkProcessor.processLinks(resolvedS3AudioLinks);
    }

    /**
     * Process and update span embed links in the view.
     *
     * @param update
     */
    private async processSpanEmbedLinks(element: HTMLElement) {
        const resolvedS3SpanEmbedLinks =
            this.spanEmbedResolver.resolveHtmlElement(element);
        console.debug(
            `${this.moduleName}::processSpanEmbedLinks - Resolved S3 span embed links`,
            resolvedS3SpanEmbedLinks
        );

        this.linkProcessor.processLinks(resolvedS3SpanEmbedLinks);
    }
}
