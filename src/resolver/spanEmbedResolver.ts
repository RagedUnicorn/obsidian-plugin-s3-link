import Config from "../config";
import Resolver from "./resolver";

export default class SpanEmbedResolver extends Resolver {
    private readonly moduleName = "SpanEmbedResolver";
    // span.internal-embed is being used by markdown processor (TODO code mirror seems to be using div.internal-embed)
    targetElement = "span.internal-embed";

    constructor() {
        super();
    }

    /**
     * Resolve all audio tags that contain a link to an S3 object in the plugins expected format.
     *
     * @param element An HTMLElement containing the rendered markdown content
     *
     * @returns two separate maps for objectKeys and signObjectKeys
     */
    public resolveHtmlElement(element: HTMLElement): {
        objectKeys: Map<string, HTMLElement[]>;
        signObjectKeys: Map<string, HTMLElement[]>;
    } {
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

            return {
                objectKeys: this.objectKeys,
                signObjectKeys: this.signObjectKeys,
            };
        }

        spanEmbedElements.forEach((spanEmbedElement) => {
            const src = spanEmbedElement.getAttribute("src");

            if (src) {
                const parts = src.split(Config.S3_LINK_SPLITTER);

                if (parts[this.s3LinkLeftPart] == Config.S3_FILE_LINK_PREFIX) {
                    console.debug(
                        `${this.moduleName} - SpanResolver found link:`,
                        src
                    );

                    this.addObjectKey(
                        parts[this.s3LinkRightPart],
                        spanEmbedElement
                    );
                } else if (
                    parts[this.s3LinkLeftPart] == Config.S3_SIGNED_LINK_PREFIX
                ) {
                    console.debug(
                        `${this.moduleName}::resolveHtmlElement - DivResolver found sign link:`,
                        spanEmbedElement.src
                    );

                    this.addSignObjectKey(
                        parts[this.s3LinkRightPart],
                        spanEmbedElement
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
