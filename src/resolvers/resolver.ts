export default abstract class Resolver {
    /**
     * objectKeys of items that are supposed to be downloaded from S3
     */
    protected objectKeys = new Map<string, HTMLElement[]>();
    /**
     * objectKeys of items where a signed url is supposed to be generated
     */
    protected signObjectKeys = new Map<string, HTMLElement[]>();

    protected readonly s3LinkLeftPart = 0;
    protected readonly s3LinkRightPart = 1;
    protected abstract readonly moduleName: string;
    protected abstract readonly targetElement: TargetElement;

    public abstract resolveHtmlElement(element: HTMLElement): ResolvedElements;

    protected addFileObjectKey(objectKey: string, htmlElement: HTMLElement) {
        if (this.objectKeys.has(objectKey)) {
            this.objectKeys.get(objectKey)?.push(htmlElement);
        } else {
            this.objectKeys.set(objectKey, [htmlElement]);
        }
    }

    protected addSignObjectKey(objectKey: string, htmlElement: HTMLElement) {
        if (this.signObjectKeys.has(objectKey)) {
            this.signObjectKeys.get(objectKey)?.push(htmlElement);
        } else {
            this.signObjectKeys.set(objectKey, [htmlElement]);
        }
    }

    protected clearObjectKeys() {
        this.objectKeys.clear();
    }

    protected clearSignObjectKeys() {
        this.signObjectKeys.clear();
    }

    /**
     * Helper function to process a valid object key.
     *
     * @param moduleName The name of the current module, used for logging.
     * @param objectKey The object key to validate
     * @param htmlElement The HTML element associated with the object key
     * @param isSigned Whether the key is a signed key
     */
    protected processValidObjectKey(
        objectKey: string,
        htmlElement: HTMLElement,
        isSigned: boolean
    ): void {
        const className = this.moduleName;

        if (this.isValidObjectKey(objectKey)) {
            if (isSigned) {
                this.addSignObjectKey(objectKey, htmlElement);
            } else {
                this.addFileObjectKey(objectKey, htmlElement);
            }
            console.debug(
                `${className}::processValidObjectKey - Valid ${
                    isSigned ? "signed" : "regular"
                } objectKey found:`,
                objectKey
            );
        } else {
            console.warn(
                `${className}::processValidObjectKey - Invalid objectKey(ignoring):`,
                objectKey
            );
        }
    }

    /**
     * Keys that end with / are S3 Prefixes and not objects. We ignore those.
     *
     * @param objectKey
     * @returns
     */
    protected isValidObjectKey(objectKey: string): boolean {
        return objectKey.length > 0 && !objectKey.endsWith("/");
    }
}

export type TargetElement =
    | "img"
    | "audio"
    | "video"
    | "div.internal-embed"
    | "span.internal-embed";

/**
 * Represents resolved HTML elements grouped by S3 object key.
 */
export type ResolvedElements = {
    /** Items to be directly downloaded from S3 */
    objectKeys: Map<string, HTMLElement[]>;
    /** Items needing signed URLs */
    signObjectKeys: Map<string, HTMLElement[]>;
};
