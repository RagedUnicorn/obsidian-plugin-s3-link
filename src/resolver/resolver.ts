export default abstract class Resolver {
    /**
     * objectKeys of items that are supposed to be downloaded from S3
     */
    objectKeys = new Map<string, HTMLElement[]>();
    /**
     * objectKeys of items where a signed url is supposed to be generated
     */
    signObjectKeys = new Map<string, HTMLElement[]>();
    protected s3LinkLeftPart = 0;
    protected s3LinkRightPart = 1;

    abstract targetElement: string;

    abstract resolveHtmlElement(element: HTMLElement): {
        objectKeys: Map<string, HTMLElement[]>;
        signObjectKeys: Map<string, HTMLElement[]>;
    };

    public addObjectKey(objectKey: string, htmlElement: HTMLElement) {
        if (this.objectKeys.has(objectKey)) {
            this.objectKeys.get(objectKey)?.push(htmlElement);
        } else {
            this.objectKeys.set(objectKey, [htmlElement]);
        }
    }

    public addSignObjectKey(objectKey: string, htmlElement: HTMLElement) {
        if (this.signObjectKeys.has(objectKey)) {
            this.signObjectKeys.get(objectKey)?.push(htmlElement);
        } else {
            this.signObjectKeys.set(objectKey, [htmlElement]);
        }
    }

    public clearObjectKeys() {
        this.objectKeys.clear();
    }

    public clearSignObjectKeys() {
        this.signObjectKeys.clear();
    }
}
