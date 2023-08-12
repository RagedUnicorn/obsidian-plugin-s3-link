import Config from "../config";
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
                    `${this.moduleName} - VideoResolver found link:`,
                    videoElement.src
                );

                this.addObjectKey(parts[this.s3LinkRightPart], videoElement);
            } else if (
                parts[this.s3LinkLeftPart] == Config.S3_SIGNED_LINK_PREFIX
            ) {
                console.debug(
                    `${this.moduleName} - VideoResolver found sign link:`,
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

    /**
     * Search an html element for all video tags that contain a link to an S3 cached object based on a data attribute.
     * If an element does not contain a data attribute, it is ignored.
     * 
     * This method only make sense to be called after the plugin updated the rendered view with links to the local cache.
     * 
     * @param element
     * 
     * @returns 
     */
    public findAllObjectKeysInElement(element: HTMLElement): string[] {
        const objectKeys: string[] = [];
        const videoElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLVideoElement>;
            
        videoElements.forEach((videoElement) => {
            const s3Data = videoElement.getAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE
            );

            if (s3Data) {
                objectKeys.push(s3Data);
            }
        });

        return objectKeys;
    }
}
