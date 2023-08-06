import Config from "../config";
import Resolver from "./resolver";

export default class AnchorResolver extends Resolver {
    private readonly moduleName = "AnchorResolver";
    targetElement = "a";

    constructor() {
        super();
    }

    /**
     * Resolve all anchor tags that contain a link to an S3 object in the plugins expected format.
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

        const anchorElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLAnchorElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (anchorElements.length == 0) {
            console.debug(
                `${this.moduleName} - Rendered markdown content does not contain any anchor tags, aborting...`
            );

            return {
                objectKeys: this.objectKeys,
                signObjectKeys: this.signObjectKeys,
            };
        }

        anchorElements.forEach((anchorElement) => {
            const parts = anchorElement.href.split(Config.S3_LINK_SPLITTER);

            if (parts[this.s3LinkLeftPart] == Config.S3_LINK_PREFIX) {
                console.debug(
                    `${this.moduleName} - S3 AnchorResolver found link:`,
                    anchorElement.href
                );

                this.addObjectKey(parts[this.s3LinkRightPart], anchorElement);
            } else if (
                parts[this.s3LinkLeftPart] == Config.S3_SIGNED_LINK_PREFIX
            ) {
                console.debug(
                    `${this.moduleName} - S3 AnchorResolver found sign link:`,
                    anchorElement.href
                );

                this.addSignObjectKey(
                    parts[this.s3LinkRightPart],
                    anchorElement
                );
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
