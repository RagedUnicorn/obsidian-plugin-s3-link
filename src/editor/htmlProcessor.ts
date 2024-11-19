import Config from "../config";
import S3SignedLink from "../model/s3SignedLinks";

export function updateSignedLinkReferences(
    processedLinks: Map<S3SignedLink, HTMLElement[]>
) {
    for (const [processedLink, htmlElements] of processedLinks) {
        console.debug(
            "updateSignedLinkReferences - Updating signed link references",
            processedLink,
            htmlElements
        );

        htmlElements.forEach(async (htmlElement) => {
            if (htmlElement instanceof HTMLImageElement) {
                htmlElement.src = processedLink.signedUrl;
            } else if (htmlElement instanceof HTMLVideoElement) {
                htmlElement.autoplay = false;
                htmlElement.src = processedLink.signedUrl;
            } else {
                console.error(
                    "updateSignedLinkReferences - Unsupported HTML element",
                    htmlElement
                );
            }

            htmlElement.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                `${Config.S3_SIGNED_LINK_PREFIX}/${processedLink.objectKey}`
            );
        });
    }
}
