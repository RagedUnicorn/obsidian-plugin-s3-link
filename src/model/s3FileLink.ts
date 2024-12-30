/**
 * S3FileLink
 *
 * Represents all relevant data for a file link to an S3 object
 *
 */
type S3FileLink = {
    objectKey: string;
    lastUpdate: number;
    versionId: string;
};

export default S3FileLink;

export function createS3FileLink(
    objectKey: string,
    versionId: string
): S3FileLink {
    return {
        objectKey: objectKey,
        lastUpdate: Date.now(),
        versionId: versionId,
    };
}
