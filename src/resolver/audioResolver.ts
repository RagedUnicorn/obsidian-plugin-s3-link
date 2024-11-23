import Config from "../config";
import Resolver from "./resolver";

export default class AudioResolver extends Resolver {
    private readonly moduleName = "AudioResolver";
    targetElement = "audio";

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

        const audioElements = element.querySelectorAll(
            this.targetElement
        ) as NodeListOf<HTMLImageElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (audioElements.length == 0) {
            console.debug(
                `${this.moduleName}::resolveHtmlElement - Rendered markdown content does not contain any audio tags, aborting...`
            );

            return {
                objectKeys: this.objectKeys,
                signObjectKeys: this.signObjectKeys,
            };
        }

        audioElements.forEach((audioElement) => {
            const parts = audioElement.src.split(Config.S3_LINK_SPLITTER);

            if (parts[this.s3LinkLeftPart] == Config.S3_FILE_LINK_PREFIX) {
                console.debug(
                    `${this.moduleName}::resolveHtmlElement - AudioResolver found link:`,
                    audioElement.src
                );

                this.addObjectKey(parts[this.s3LinkRightPart], audioElement);
            } else if (
                parts[this.s3LinkLeftPart] == Config.S3_SIGNED_LINK_PREFIX
            ) {
                console.debug(
                    `${this.moduleName}::resolveHtmlElement - AudioResolver found sign link:`,
                    audioElement.src
                );

                this.addSignObjectKey(
                    parts[this.s3LinkRightPart],
                    audioElement
                );
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
