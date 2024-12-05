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
    protected abstract targetElement: string;

    public abstract resolveHtmlElement(element: HTMLElement): {
        objectKeys: Map<string, HTMLElement[]>;
        signObjectKeys: Map<string, HTMLElement[]>;
    };

    protected addObjectKey(objectKey: string, htmlElement: HTMLElement) {
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
        moduleName: string,
        objectKey: string,
        htmlElement: HTMLElement,
        isSigned: boolean
    ): void {
        if (this.isValidObjectKey(objectKey)) {
            if (isSigned) {
                this.addSignObjectKey(objectKey, htmlElement);
            } else {
                this.addObjectKey(objectKey, htmlElement);
            }
            console.debug(
                `${moduleName}::processValidObjectKey - Valid ${
                    isSigned ? "signed" : "regular"
                } objectKey found:`,
                objectKey
            );
        } else {
            console.warn(
                `${moduleName}::processValidObjectKey - Invalid objectKey(ignoring):`,
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
