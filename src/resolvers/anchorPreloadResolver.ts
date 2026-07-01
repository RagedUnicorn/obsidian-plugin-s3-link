import Config from "../config/config";
import Resolver, { TargetElement, ResolvedElements } from "./resolver";

/**
 * Resolver for preloading S3 files referenced in anchor tags.
 * This resolver doesn't modify the HTML, it just identifies S3 links
 * so they can be downloaded to cache before the user clicks them.
 *
 * It offers two entry points because the two rendering modes expose links
 * differently: in reading mode the rendered DOM carries the s3: href
 * (resolveHtmlElement), while in editing/live-preview mode the anchor hrefs
 * are not reliable, so we scan the raw document text instead
 * (resolveTextContent). Only regular s3: links are preloaded; signed links
 * are opened in the browser and therefore skipped.
 */
export default class AnchorPreloadResolver extends Resolver {
    protected override readonly moduleName = "AnchorPreloadResolver";
    protected override readonly targetElement: TargetElement = "a"; // Not used, but required by base class

    constructor() {
        super();
    }

    /**
     * Resolve all anchor tags that contain a link to an S3 object.
     * This is used for preloading files, not for modifying the HTML.
     *
     * @param element An HTMLElement containing the rendered markdown content
     * @returns two separate maps for objectKeys and signObjectKeys
     */
    public resolveHtmlElement(element: HTMLElement): ResolvedElements {
        console.debug(
            `${this.moduleName}::resolveHtmlElement - Processing rendered html content for preloading`
        );

        const anchorElements = element.querySelectorAll(
            "a"
        ) as NodeListOf<HTMLAnchorElement>;
        this.clearObjectKeys();
        this.clearSignObjectKeys();

        if (anchorElements.length == 0) {
            console.debug(
                `${this.moduleName}::resolveHtmlElement - No anchor tags found for preloading`
            );
        }

        anchorElements.forEach((anchorElement) => {
            const href = anchorElement.getAttribute("href");

            if (href) {
                const parts = href.split(Config.S3_LINK_SPLITTER);
                const linkPrefix = parts[0];
                const objectKey = parts
                    .slice(1)
                    .join(Config.S3_LINK_SPLITTER);

                // Only preload regular s3: links, not signed links
                if (linkPrefix === Config.S3_FILE_LINK_PREFIX && objectKey) {
                    this.processValidObjectKey(objectKey, anchorElement, false);
                }
            }
        });

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }

    /**
     * Resolve S3 links from raw document text.
     * Used in editing/live-preview mode where anchor hrefs are not reliable,
     * so we scan the markdown source for s3: links instead.
     *
     * @param textContent The full document text to scan
     * @returns two separate maps for objectKeys and signObjectKeys
     */
    public resolveTextContent(textContent: string): ResolvedElements {
        console.debug(
            `${this.moduleName}::resolveTextContent - Scanning document text for preloadable S3 links`
        );

        this.clearObjectKeys();
        this.clearSignObjectKeys();

        // Markdown links [text](s3:key) and raw links preceded by start/whitespace.
        // The raw pattern requires a leading boundary so it doesn't re-match the
        // s3: inside a markdown link (which is preceded by "(").
        const markdownLinkRegex = /\[[^\]]+\]\((s3(?:-sign)?):([^)]+)\)/g;
        const rawLinkRegex = /(?:^|\s)(s3(?:-sign)?):(\S+)/g;

        for (const regex of [markdownLinkRegex, rawLinkRegex]) {
            let match;
            while ((match = regex.exec(textContent)) !== null) {
                const [, linkPrefix, objectKey] = match;

                // Only preload regular s3: links, not signed links
                if (
                    linkPrefix === Config.S3_FILE_LINK_PREFIX &&
                    this.isValidObjectKey(objectKey) &&
                    !this.objectKeys.has(objectKey)
                ) {
                    // No HTML element to associate in editing mode; preloading
                    // only needs the key to trigger the download.
                    this.objectKeys.set(objectKey, []);
                }
            }
        }

        return {
            objectKeys: this.objectKeys,
            signObjectKeys: this.signObjectKeys,
        };
    }
}
