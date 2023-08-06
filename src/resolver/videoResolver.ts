import Config from "../config";
import Resolver from "./resolver";

export default class S3VideoResolver extends Resolver {
    private readonly moduleName = "S3VideoResolver";
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
                `${this.moduleName} - Rendered markdown content does not contain any video tags, aborting...`
            );

            return {
                objectKeys: this.objectKeys,
                signObjectKeys: this.signObjectKeys,
            };
        }

        videoElements.forEach((videoElement) => {
            const parts = videoElement.src.split(Config.S3_LINK_SPLITTER);

            if (parts[this.s3LinkLeftPart] == Config.S3_LINK_PREFIX) {
                console.debug(
                    `${this.moduleName} - S3 VideoResolver found link:`,
                    videoElement.src
                );

                this.addObjectKey(parts[this.s3LinkRightPart], videoElement);
            } else if (
                parts[this.s3LinkLeftPart] == Config.S3_SIGNED_LINK_PREFIX
            ) {
                console.debug(
                    `${this.moduleName} - S3 VideoResolver found sign link:`,
                    videoElement.src
                );

                this.addSignObjectKey(
                    parts[this.s3LinkRightPart],
                    videoElement
                );
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
