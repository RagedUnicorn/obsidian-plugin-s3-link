import { emitter } from "../event/event";
import S3SignedLink from "../model/s3SignedLink";
import { AwsS3Client } from "../network/awsS3Client";
import { PluginSettings } from "../settings/settings";

import LocalStorageSignedLinkCache from "../cache/localStorageSignedLinkCache";

export class LinkProcessor {
    private readonly moduleName = "LinkProcessor";

    constructor(
        private localStorageSignedLinkCache: LocalStorageSignedLinkCache,
        private pluginSettings: PluginSettings,
        private awsS3Client: AwsS3Client
    ) {
        console.info(`${this.moduleName}::constructor - LinkProcessor created`);
    }

    public async processLinks(resolvedS3ImageLinks: {
        objectKeys: Map<string, HTMLElement[]>;
        signObjectKeys: Map<string, HTMLElement[]>;
    }) {
        const resolvedS3FileLinks: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.objectKeys.entries()),
        ]);

        const resolvedS3SignLinks: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.signObjectKeys.entries()),
        ]);

        // await this.processS3FileLinks(resolvedS3FileLinks);
        this.processS3SignLinks(resolvedS3SignLinks);
    }

    /**
     * Process S3 sign links
     *
     * @param resolvedS3SignLinks
     *     A map of object keys to their respective HTML elements
     * @returns Map<S3SignedLink, HTMLElement[]>
     *     A map of s3 signed links to their respective HTML elements or an empty map if no links were processed
     */
    private async processS3SignLinks(
        resolvedS3SignLinks: Map<string, HTMLElement[]>
    ) {
        for (const [objectKey, htmlElements] of resolvedS3SignLinks) {
            console.debug(
                `${this.moduleName} - Processing S3 signLink ${objectKey}`
            );

            const cachedSignedLink = this.findCachedSignedLink(objectKey);

            if (cachedSignedLink) {
                this.emitSignLinkProcessed(cachedSignedLink, htmlElements);
                continue;
            }

            await this.processAndCacheSignedLink(objectKey, htmlElements);
        }
    }

    /**
     * Fetch and cache signed link, then emit event
     *
     * @param objectKey The S3 object key
     * @param htmlElements The associated HTML elements
     */
    private async processAndCacheSignedLink(
        objectKey: string,
        htmlElements: HTMLElement[]
    ) {
        try {
            const signedUrl = await this.awsS3Client.getSignedUrlForObject(
                objectKey
            );

            if (signedUrl) {
                console.debug(
                    `${this.moduleName} - Retrieved signed URL`,
                    signedUrl
                );

                const processedLink = new S3SignedLink(
                    objectKey,
                    Date.now(),
                    signedUrl
                );

                this.localStorageSignedLinkCache.cacheSignedLink(processedLink);
                this.emitSignLinkProcessed(processedLink, htmlElements);
            }
        } catch (error) {
            console.error(
                `${this.moduleName} - Error processing S3 signLink ${objectKey} ignoring link`,
                error
            );
        }
    }

    /**
     * Emit the sign link processed event
     *
     * @param s3SignedLink The signed link to emit
     * @param htmlElements The associated HTML elements
     */
    private emitSignLinkProcessed(
        s3SignedLink: S3SignedLink,
        htmlElements: HTMLElement[]
    ) {
        console.info(
            `${this.moduleName} - Sending Event signLinkProcess`,
            s3SignedLink
        );
        emitter.emit("signLinkProcessed", {
            elements: htmlElements,
            s3SignedLink,
        });
    }

    /**
     * Retrieve cached signed link for an object key
     *
     * @param objectKey The S3 object key
     * @returns Cached signed link or null if not found
     */
    private findCachedSignedLink(objectKey: string): S3SignedLink | null {
        return this.localStorageSignedLinkCache.findCachedSignedLink(objectKey);
    }
}
