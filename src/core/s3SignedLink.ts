import S3Link from "./s3Link";
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
type S3SignedLink = S3Link & {
    signedUrl: string;
};

export default S3SignedLink;

export function createS3SignedLink(
    objectKey: string,
    signedUrl: string
): S3SignedLink {
    return {
        objectKey: objectKey,
        lastUpdate: Date.now(),
        signedUrl: signedUrl,
    };
}
