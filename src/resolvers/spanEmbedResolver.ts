import Config from "../config/config";
import Resolver, { TargetElement, ResolvedElements } from "./resolver";

export default class SpanEmbedResolver extends Resolver {
    protected override readonly moduleName = "SpanEmbedResolver";
    protected override readonly targetElement: TargetElement =
        "span.internal-embed";

    constructor() {
        super();
    }

    /**
     * Resolve all span tags that contain a link to an S3 object in the plugins expected format.
     *
     * @param element An HTMLElement containing the rendered markdown content
     *
     * @returns two separate maps for objectKeys and signObjectKeys
     */
    public resolveHtmlElement(element: HTMLElement): ResolvedElements {
        console.debug(
            `${this.moduleName}::resolveHtmlElement - Processing rendered html content`
        );

        const spanEmbedElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLImageElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (spanEmbedElements.length == 0) {
            console.debug(
                `${this.moduleName}::resolveHtmlElement - Rendered markdown content does not contain any span embed tags, aborting...`
            );
        }

        spanEmbedElements.forEach((spanEmbedElement) => {
            const src = spanEmbedElement.getAttribute("src");

            if (src) {
                const parts = src.split(Config.S3_LINK_SPLITTER);
                const linkPrefix = parts[this.s3LinkLeftPart];
                const objectKey = parts[this.s3LinkRightPart];

                if (linkPrefix === Config.S3_FILE_LINK_PREFIX) {
                    this.processValidObjectKey(
                        objectKey,
                        spanEmbedElement,
                        false
                    );
                } else if (linkPrefix === Config.S3_SIGNED_LINK_PREFIX) {
                    this.processValidObjectKey(
                        objectKey,
                        spanEmbedElement,
                        true
                    );
                }
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
