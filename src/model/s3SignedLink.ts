/**
 * S3SignedLink
 *
 * Represents all relevant data for a signed link to an S3 object
 *
 * Signed links don't require a versionId because they are signed for a specific object and will keep
 * working until the expiration time is reached. This is the case even if the object is updated.
 *
 * The exception is when the object is deleted, in which case the signed link will no longer work.
 */
export default class S3SignedLink {
    objectKey: string;
    lastUpdate: number;
    signedUrl: string;

    constructor(objectKey: string, lastUpdate: number, signedUrl: string) {
        this.objectKey = objectKey;
        this.lastUpdate = lastUpdate;
        this.signedUrl = signedUrl;
    }
}
