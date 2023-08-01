/**
 * S3SignedLink
 *
 * Represents all relevant data for a signed link to an S3 object
 */
export class S3SignedLink {
    objectKey: string;
    lastUpdate: number;
    signedUrl: string;

    constructor(objectKey: string, lastUpdate: number, signedUrl: string) {
        this.objectKey = objectKey;
        this.lastUpdate = lastUpdate;
        this.signedUrl = signedUrl;
    }
}
