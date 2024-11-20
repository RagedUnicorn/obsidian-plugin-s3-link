/**
 * S3Link
 *
 * Represents all relevant data for an S3 link object
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
