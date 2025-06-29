import Config from "../config/config";
import Resolver, { TargetElement, ResolvedElements } from "./resolver";

export default class AudioResolver extends Resolver {
    protected override readonly moduleName = "AudioResolver";
    protected override readonly targetElement: TargetElement = "audio";

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
    public resolveHtmlElement(element: HTMLElement): ResolvedElements {
        console.debug(
            `${this.moduleName}::resolveHtmlElement - Processing rendered html content`
        );

        const audioElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLImageElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (audioElements.length == 0) {
            console.debug(
                `${this.moduleName}::resolveHtmlElement - Rendered markdown content does not contain any audio tags`
            );
        }

        audioElements.forEach((audioElement) => {
            const parts = audioElement.src.split(Config.S3_LINK_SPLITTER);
            const linkPrefix = parts[this.s3LinkLeftPart];
            const objectKey = parts[this.s3LinkRightPart];

            if (linkPrefix === Config.S3_FILE_LINK_PREFIX) {
                this.processValidObjectKey(objectKey, audioElement, false);
            } else if (linkPrefix === Config.S3_SIGNED_LINK_PREFIX) {
                this.processValidObjectKey(objectKey, audioElement, true);
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
