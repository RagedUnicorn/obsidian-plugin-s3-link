import Config from "../config/config";
import Resolver, { TargetElement, ResolvedElements } from "./resolver";

export default class ImageResolver extends Resolver {
    protected override readonly moduleName = "ImageResolver";
    protected override readonly targetElement: TargetElement = "img";

    constructor() {
        super();
    }

    /**
     * Resolve all image tags that contain a link to an S3 object in the plugins expected format.
     *
     * @param element An HTMLElement containing the rendered markdown content
     *
     * @returns two separate maps for objectKeys and signObjectKeys
     */
    public resolveHtmlElement(element: HTMLElement): ResolvedElements {
        console.debug(
            `${this.moduleName}::resolveHtmlElement - Processing rendered html content`
        );

        const imageElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLImageElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (imageElements.length == 0) {
            console.debug(
                `${this.moduleName}::resolveHtmlElement - Rendered markdown content does not contain any image tags`
            );
        }

        imageElements.forEach((imageElement) => {
            const parts = imageElement.src.split(Config.S3_LINK_SPLITTER);
            const linkPrefix = parts[this.s3LinkLeftPart];
            const objectKey = parts[this.s3LinkRightPart];

            if (linkPrefix === Config.S3_FILE_LINK_PREFIX) {
                this.processValidObjectKey(objectKey, imageElement, false);
            } else if (linkPrefix === Config.S3_SIGNED_LINK_PREFIX) {
                this.processValidObjectKey(objectKey, imageElement, true);
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
