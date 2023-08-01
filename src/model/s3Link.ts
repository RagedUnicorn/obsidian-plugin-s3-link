/**
 * S3Link
 *
 * Represents all relevant data for an S3 object
 */
export class S3Link {
    objectKey: string;
    lastUpdate: number;
    versionId: string;

    constructor(objectKey: string, lastUpdate: number, versionId: string) {
        this.objectKey = objectKey;
        this.lastUpdate = lastUpdate;
        this.versionId = versionId;
    }
}
