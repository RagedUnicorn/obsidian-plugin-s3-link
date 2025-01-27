/**
 * Removes the s3 link prefix from the source url.
 *
 * @param sourceUrl
 *
 * @returns the source url without the s3 link prefix (s3 or s3-sign)
 */
export function removeS3LinkPrefixFromSourceUrl(sourceUrl: string): string {
    return sourceUrl.split(":").slice(1).join("/");
}

/**
 * Gets the s3 link prefix from the source url.
 *
 * @param sourceUrl
 *
 * @returns the s3 link prefix such as s3 or s3-sign
 */
export function getS3LinkPrefixFromSourceUrl(sourceUrl: string): string {
    return sourceUrl.split(":")[0];
}

/**
 * Finds all object keys in the text (non-rendered or html text) from the source url.
 *
 * @param content
 *
 * @returns an array of object keys
 */
export function findAllObjectKeysInText(content: string): string[] {
    const regex = /(s3(?:-sign)?:[\w/.-]+)/g;
    return [...content.matchAll(regex)].map((match) => match[0]);
}
