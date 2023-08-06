import Config from "../config";
import S3Resolver from "./s3Resolver";

export default class S3SpanResolver extends S3Resolver {
    private readonly moduleName = "S3SpanResolver";
    targetElement = "span";

    constructor() {
        super();
    }

    /**
     * Resolve all video tags that contain a link to an S3 object in one of the plugins expected format.
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

        const spanElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLSpanElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (spanElements.length == 0) {
            console.debug(
                `${this.moduleName} - Rendered markdown content does not contain any span tags, aborting...`
            );

            return {
                objectKeys: this.objectKeys,
                signObjectKeys: this.signObjectKeys,
            };
        }

        spanElements.forEach((spanElement) => {
            const src = spanElement.getAttribute("src");

            if (src) {
                const parts = src.split(Config.S3_LINK_SPLITTER);

                if (parts[this.s3LinkLeftPart] == Config.S3_LINK_PREFIX) {
                    console.debug(
                        `${this.moduleName} - S3 SpanResolver found link:`,
                        src
                    );

                    this.addObjectKey(parts[this.s3LinkRightPart], spanElement);
                } else if (
                    parts[this.s3LinkLeftPart] == Config.S3_SIGNED_LINK_PREFIX
                ) {
                    // Span elements are used by Obsidian to render local files and does not support remote urls
                    console.warn(
                        `${this.moduleName} - Signed links are not supported for span elements. Skipping ${src}`
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
