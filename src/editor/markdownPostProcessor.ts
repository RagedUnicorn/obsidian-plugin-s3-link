import { App } from "obsidian";

import S3LinkPlugin from "../main";
import LinkProcessor from "../core/linkProcessor";
import ImageResolver from "../resolvers/imageResolver";
import VideoResolver from "../resolvers/videoResolver";
import AudioResolver from "../resolvers/audioResolver";
import SpanEmbedResolver from "../resolvers/spanEmbedResolver";
import AnchorPreloadResolver from "../resolvers/anchorPreloadResolver";

export default class MarkdownPostProcessor {
    private readonly moduleName = "S3PostProcessor";
    private app: App;
    private linkProcessor: LinkProcessor;
    private imageResolver: ImageResolver;
    private videoResolver: VideoResolver;
    private audioResolver: AudioResolver;
    private spanEmbedResolver: SpanEmbedResolver;
    private anchorPreloadResolver: AnchorPreloadResolver;

    constructor(private plugin: S3LinkPlugin) {
        this.app = plugin.app;
        this.linkProcessor = plugin.linkProcessor;
        this.imageResolver = new ImageResolver();
        this.videoResolver = new VideoResolver();
        this.audioResolver = new AudioResolver();
        this.spanEmbedResolver = new SpanEmbedResolver();
        this.anchorPreloadResolver = new AnchorPreloadResolver();

        console.info(
            `${this.moduleName}::constructor - MarkdownPostProcessor created`
        );
    }

    /**
     * Callback for the markdown post processor. Invoked when markdown is rendered.
     * Note: The content is dependent on the context and doesn't necessarily contain the whole markdown file.
     *
     * @param element HTMLElement containing the rendered markdown content
     */
    public async onMarkdownPostProcessor(element: HTMLElement) {
        console.debug(
            `${this.moduleName}::onMarkdownPostProcessor - Processing rendered html content`
        );

        this.processImageLinks(element);
        this.processVideoLinks(element);
        this.processAudioLinks(element);
        this.processSpanEmbedLinks(element);
        this.processAnchorPreloadLinks(element);
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

    /**
     * Process anchor links for preloading.
     * This triggers downloads for s3: links but doesn't modify the HTML.
     *
     * @param element
     */
    private async processAnchorPreloadLinks(element: HTMLElement) {
        const resolvedS3AnchorLinks =
            this.anchorPreloadResolver.resolveHtmlElement(element);

        // Only process if there are files to preload
        if (resolvedS3AnchorLinks.objectKeys.size > 0) {
            console.debug(
                `${this.moduleName}::processAnchorPreloadLinks - Preloading ${resolvedS3AnchorLinks.objectKeys.size} S3 files from anchor links`
            );
            this.linkProcessor.processLinks(resolvedS3AnchorLinks);
        }
    }
}
