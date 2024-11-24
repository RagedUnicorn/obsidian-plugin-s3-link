import Config from "../config";
import Resolver from "./resolver";

export default class DivEmbedResolver extends Resolver {
    private readonly moduleName = "DivEmbedResolver";
    // div.internal-embed is being used by code mirror
    targetElement = "div.internal-embed";

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

        const divEmbedElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLImageElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (divEmbedElements.length == 0) {
            console.debug(
                `${this.moduleName}::resolveHtmlElement - Rendered markdown content does not contain any div embed tags, aborting...`
            );

            return {
                objectKeys: this.objectKeys,
                signObjectKeys: this.signObjectKeys,
            };
        }

        divEmbedElements.forEach((divEmbedElement) => {
            const src = divEmbedElement.getAttribute("src");

            if (src) {
                const parts = src.split(Config.S3_LINK_SPLITTER);

                if (parts[this.s3LinkLeftPart] == Config.S3_FILE_LINK_PREFIX) {
                    console.debug(
                        `${this.moduleName} - DivResolver found link:`,
                        src
                    );

                    this.addObjectKey(
                        parts[this.s3LinkRightPart],
                        divEmbedElement
                    );
                } else if (
                    parts[this.s3LinkLeftPart] == Config.S3_SIGNED_LINK_PREFIX
                ) {
                    console.debug(
                        `${this.moduleName}::resolveHtmlElement - DivResolver found sign link:`,
                        divEmbedElement.src
                    );

                    this.addSignObjectKey(
                        parts[this.s3LinkRightPart],
                        divEmbedElement
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
