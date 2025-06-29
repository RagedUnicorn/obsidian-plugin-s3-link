import Config from "../config/config";
import Resolver, { TargetElement, ResolvedElements } from "./resolver";

export default class DivEmbedResolver extends Resolver {
    protected override readonly moduleName = "DivEmbedResolver";
    protected override readonly targetElement: TargetElement =
        "div.internal-embed";

    constructor() {
        super();
    }

    /**
     * Resolve all div tags that contain a link to an S3 object in the plugins expected format.
     *
     * @param element An HTMLElement containing the rendered markdown content
     *
     * @returns two separate maps for objectKeys and signObjectKeys
     */
    public resolveHtmlElement(element: HTMLElement): ResolvedElements {
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
        }

        divEmbedElements.forEach((divEmbedElement) => {
            const src = divEmbedElement.getAttribute("src");

            if (src) {
                const parts = src.split(Config.S3_LINK_SPLITTER);
                const linkPrefix = parts[this.s3LinkLeftPart];
                const objectKey = parts[this.s3LinkRightPart];

                if (linkPrefix === Config.S3_FILE_LINK_PREFIX) {
                    this.processValidObjectKey(
                        objectKey,
                        divEmbedElement,
                        false
                    );
                } else if (linkPrefix === Config.S3_SIGNED_LINK_PREFIX) {
                    this.processValidObjectKey(
                        objectKey,
                        divEmbedElement,
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
