import Config from "../config/config";
import Resolver from "./resolver";

export default class VideoResolver extends Resolver {
    private readonly moduleName = "VideoResolver";
    targetElement = "video";

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

        const videoElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLVideoElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (videoElements.length == 0) {
            console.debug(
                `${this.moduleName}::resolveHtmlElement - Rendered markdown content does not contain any video tags`
            );
        }

        videoElements.forEach((videoElement) => {
            const parts = videoElement.src.split(Config.S3_LINK_SPLITTER);
            const linkPrefix = parts[this.s3LinkLeftPart];
            const objectKey = parts[this.s3LinkRightPart];

            if (linkPrefix === Config.S3_FILE_LINK_PREFIX) {
                this.processValidObjectKey(
                    this.moduleName,
                    objectKey,
                    videoElement,
                    false
                );
            } else if (linkPrefix === Config.S3_SIGNED_LINK_PREFIX) {
                this.processValidObjectKey(
                    this.moduleName,
                    objectKey,
                    videoElement,
                    true
                );
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
