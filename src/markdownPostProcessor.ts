import ImageResolver from "./resolver/imageResolver";
import S3LinkPlugin from "./main";

export class MarkdownPostProcessor {
    private readonly moduleName = "S3PostProcessor";
    private imageResolver: ImageResolver;

    constructor(plugin: S3LinkPlugin) {
        this.imageResolver = new ImageResolver();
    }

    /**
     * Callback for the markdown post processor. Invoked when markdown is rendered.
     * Note: This will only trigger in the preview mode and not in the editor mode.
     * Note: The content is dependent on the context and doesn't necessarily contain the whole markdown file.
     *
     * @param element HTMLElement containing the rendered markdown content
     */
    public async onMarkdownPostProcessor(element: HTMLElement) {
        console.debug(
            `${this.moduleName}::onMarkdownPostProcessor - Processing rendered html content`
        );

        const resolvedS3ImageLinks =
            this.imageResolver.resolveHtmlElement(element);
    }
}
