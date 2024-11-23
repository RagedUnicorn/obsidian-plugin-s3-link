/**
 * S3FileLink
 *
 * Represents all relevant data for a file link to an S3 object
 *
 */
export default class S3FileLink {
    objectKey: string;
    lastUpdate: number;
    versionId: string;

    constructor(objectKey: string, lastUpdate: number, versionId: string) {
        this.objectKey = objectKey;
        this.lastUpdate = lastUpdate;
        this.versionId = versionId;
    }
}
