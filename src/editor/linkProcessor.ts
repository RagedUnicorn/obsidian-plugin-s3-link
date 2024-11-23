import { emitter } from "../event/event";
import S3SignedLink from "../model/s3SignedLink";
import { AwsS3Client } from "../network/awsS3Client";
import { PluginSettings } from "../settings/settings";
import { Readable } from "stream";
import FileCache from "../cache/fileCache";
import LocalStorageSignedLinkCache from "../cache/localStorageSignedLinkCache";
import LocalStorageFileLinkCache from "../cache/localStorageFileLinkCache";
import S3FileLink from "../model/s3FileLink";

export class LinkProcessor {
    private readonly moduleName = "LinkProcessor";

    constructor(
        private fileCache: FileCache,
        private localStorageSignedLinkCache: LocalStorageSignedLinkCache,
        private localStorageFileLinkCache: LocalStorageFileLinkCache,
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

        this.processS3SignLinks(resolvedS3SignLinks);
        this.processS3FileLinks(resolvedS3FileLinks);
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
                `${this.moduleName}::processS3SignLinks - Processing S3 signLink ${objectKey}`
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
                    `${this.moduleName}::processAndCacheSignedLink - Retrieved signed URL`,
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
                `${this.moduleName}::processAndCacheSignedLink - Error processing S3 signLink ${objectKey} ignoring link`,
                error
            );
        }
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
            `${this.moduleName}::emitSignLinkProcessed - Sending Event signLinkProcess`,
            s3SignedLink
        );
        emitter.emit("signLinkProcessed", {
            elements: htmlElements,
            s3SignedLink,
        });
    }

    /**
     * Process S3 file links
     *
     * @param resolvedS3FileLinks
     *     A map of object keys to their respective HTML elements
     * @returns Map<string, HTMLElement[]>
     *     A map of object keys to their respective HTML elements or an empty map if no links were processed
     */
    private async processS3FileLinks(
        resolvedS3FileLinks: Map<string, HTMLElement[]>
    ) {
        for (const [objectKey, htmlElements] of resolvedS3FileLinks) {
            console.debug(
                `${this.moduleName} - Processing S3 fileLink ${objectKey}`
            );

            const cachedFileLink =
                this.localStorageFileLinkCache.findCachedFileLink(objectKey);

            if (cachedFileLink) {
                const versionId = await this.getLatestVersionId(objectKey);
                if (versionId === cachedFileLink.versionId) {
                    console.debug(
                        `${this.moduleName} - Cached file link is up to date`,
                        cachedFileLink
                    );

                    let test = await this.fileCache.fileExistsInCacheFolder(
                        cachedFileLink.objectKey,
                        cachedFileLink.versionId
                    );
                    if (test === false) {
                        console.error(
                            "File is cached in localstorage but can't find actual file in cache folder"
                        );
                        // TODO deleting the entry from localstorage to have a clean slate again
                        this.localStorageFileLinkCache.deleteFileLinkFromCache(
                            objectKey
                        );
                    } else {
                        console.error(
                            "File is cached in localstorage and actual file is in cache folder"
                        );
                        this.emitFileLinkProcessed(
                            cachedFileLink,
                            htmlElements
                        );
                        continue;
                    }
                } // else continue process
            }

            // TODO we need to include the versionid

            await this.processAndCacheFileLink(objectKey, htmlElements);
        }
    }

    private async processAndCacheFileLink(
        objectKey: string,
        htmlElements: HTMLElement[]
    ): Promise<void> {
        try {
            const versionId = await this.getLatestVersionId(objectKey);
            if (!versionId) return;

            const stream = await this.getObjectStream(objectKey);
            if (!stream) return;

            const processedLink = this.createFileLink(objectKey, versionId);

            await this.cacheFileLink(processedLink);
            await this.saveFileToCache(objectKey, versionId, stream);
            this.emitFileLinkProcessed(processedLink, htmlElements);
        } catch (error) {
            console.error(
                `${this.moduleName}::processAndCacheFileLink - Error processing S3 fileLink: ${objectKey}`,
                error
            );
        }
    }

    /**
     * Get the latest version ID for an object in the S3 bucket.
     *
     * @param objectKey
     * @returns
     */
    private async getLatestVersionId(
        objectKey: string
    ): Promise<string | null> {
        try {
            const versionId = await this.awsS3Client.getLatestObjectVersion(
                objectKey
            );

            if (!versionId) {
                console.warn(
                    `${this.moduleName}::getLatestVersionId - No version ID found for ${objectKey}`
                );

                return null;
            }

            return versionId;
        } catch (error) {
            console.error(
                `${this.moduleName}::getLatestVersionId - Failed to retrieve version ID for ${objectKey}`,
                error
            );
            return null;
        }
    }

    /**
     * Get an object stream from S3.
     *
     * @param objectKey
     * @returns
     */
    private async getObjectStream(objectKey: string): Promise<Readable | null> {
        try {
            return await this.awsS3Client.getObject(objectKey);
        } catch (error) {
            console.error(
                `${this.moduleName} - Failed to retrieve object stream for ${objectKey}`,
                error
            );
            return null;
        }
    }

    /**
     * Create a file link object.
     * @param objectKey
     * @param versionId
     * @returns
     *    A new S3FileLink object
     */
    private createFileLink(objectKey: string, versionId: string): S3FileLink {
        return new S3FileLink(objectKey, Date.now(), versionId);
    }

    /**
     * Store metadata for a file link in the local storage cache.
     *
     * @param fileLink
     */
    private async cacheFileLink(fileLink: S3FileLink): Promise<void> {
        try {
            await this.localStorageFileLinkCache.cacheFileLink(fileLink);
        } catch (error) {
            console.error(
                `${this.moduleName}::cacheFileLink - Failed to cache file link: ${fileLink.objectKey}`,
                error
            );
        }
    }

    /**
     * Store an actual file in the cache folder.
     *
     * @param objectKey
     * @param versionId
     * @param stream
     */
    private async saveFileToCache(
        objectKey: string,
        versionId: string,
        stream: Readable
    ): Promise<void> {
        try {
            await this.fileCache.saveFileToCacheFolder(
                objectKey,
                versionId,
                stream
            );
        } catch (error) {
            console.error(
                `${this.moduleName}::saveFileToCache - Failed to save file to cache for ${objectKey}`,
                error
            );
        }
    }

    /**
     * Emit the sign link processed event
     *
     * @param s3SignedLink The signed link to emit
     * @param file The associated file
     * @param htmlElements The associated HTML elements
     */
    private emitFileLinkProcessed(
        s3FileLink: S3FileLink,
        htmlElements: HTMLElement[]
    ) {
        console.info(
            `${this.moduleName}::emitFileLinkProcessed - Sending Event fileLinkProcessed`,
            s3FileLink
        );
        emitter.emit("fileLinkProcessed", {
            elements: htmlElements,
            s3FileLink,
        });
    }
}
