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

    public abstract findAllObjectKeysInElement(element: HTMLElement): string[];

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
}
