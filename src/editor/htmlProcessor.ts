import Config from "../config";
import S3SignedLink from "../model/s3SignedLink";

/**
 * Update signed link references for a list of HTML elements.
 *
 * @param elements - Array of HTML elements to update.
 * @param s3SignedLink - The S3 signed link object.
 */
export function updateSignedLinkReferences(
    elements: HTMLElement[],
    s3SignedLink: S3SignedLink
) {
    console.debug(
        "updateSignedLinkReferences - Updating signed link references",
        s3SignedLink,
        elements
    );

    elements.forEach((htmlElement) => {
        try {
            updateElementSignedLink(htmlElement, s3SignedLink);
        } catch (error) {
            console.error(
                "updateSignedLinkReferences - Error updating element",
                htmlElement,
                error
            );
        }
    });
}

/**
 * Update a single HTML element's signed link reference.
 *
 * @param htmlElement - The HTML element to update.
 * @param s3SignedLink - The S3 signed link object.
 */
function updateElementSignedLink(
    htmlElement: HTMLElement,
    s3SignedLink: S3SignedLink
) {
    if (htmlElement instanceof HTMLImageElement) {
        updateImageElement(htmlElement, s3SignedLink);
    } else if (htmlElement instanceof HTMLVideoElement) {
        updateVideoElement(htmlElement, s3SignedLink);
    } else {
        throw new Error(`Unsupported HTML element: ${htmlElement.tagName}`);
    }

    // Add custom attribute to the element for tracking
    htmlElement.setAttribute(
        Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
        `${Config.S3_SIGNED_LINK_PREFIX}/${s3SignedLink.objectKey}`
    );
}

/**
 * Update the signed link reference for an HTMLImageElement.
 *
 * @param imageElement - The HTMLImageElement to update.
 * @param s3SignedLink - The S3 signed link object.
 */
function updateImageElement(
    imageElement: HTMLImageElement,
    s3SignedLink: S3SignedLink
) {
    imageElement.src = s3SignedLink.signedUrl;
}

/**
 * Update the signed link reference for an HTMLVideoElement.
 *
 * @param videoElement - The HTMLVideoElement to update.
 * @param s3SignedLink - The S3 signed link object.
 */
function updateVideoElement(
    videoElement: HTMLVideoElement,
    s3SignedLink: S3SignedLink
) {
    videoElement.autoplay = false; // Ensure autoplay is disabled for videos
    videoElement.src = s3SignedLink.signedUrl;
}
