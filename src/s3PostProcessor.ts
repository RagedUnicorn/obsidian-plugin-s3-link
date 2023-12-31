import { TFile } from "obsidian";
import Cache from "./cache";
import Config from "./config";
import { getVaultResourcePath } from "./obsidianHelper";
import { Client } from "./network/client";
import { PluginSettings } from "./settings/settings";
import ImageResolver from "./resolver/imageResolver";
import VideoResolver from "./resolver/videoResolver";
import SpanResolver from "./resolver/spanResolver";
import AnchorResolver from "./resolver/anchorResolver";
import S3LinkPlugin from "./main";
import S3Link from "./model/s3Link";
import { sendNotification } from "./ui/notification";
import * as path from "path";

export class S3PostProcessor {
    private readonly moduleName = "S3PostProcessor";
    private client: Client;
    private cache: Cache;
    private imageResolver: ImageResolver;
    private videoResolver: VideoResolver;
    private spanResolver: SpanResolver;
    private anchorResolver: AnchorResolver;
    private pluginSettings: PluginSettings;

    constructor(plugin: S3LinkPlugin, cache: Cache, settings: PluginSettings) {
        this.cache = cache;
        this.client = new Client(settings, plugin);
        this.imageResolver = new ImageResolver();
        this.videoResolver = new VideoResolver();
        this.spanResolver = new SpanResolver();
        this.anchorResolver = new AnchorResolver();
        this.pluginSettings = settings;
        this.client.initializeS3Client(this.pluginSettings);
    }

    /**
     * Callback for the settings tab. Invoked when the settings are changed.
     *
     * @param settings PluginSettings containing the new settings
     */
    public onSettingsChanged(settings: PluginSettings) {
        console.debug("Settings changed, reinitializing s3Client...");
        this.client.initializeS3Client(settings);
    }

    /**
     * Callback for the markdown post processor. Invoked when markdown is rendered.
     * Note: This will only trigger in the preview mode and not in the editor mode.
     * Note: The content is dependent on the context and doesn't necessarily contain the whole markdown file.
     *
     * @param element HTMLElement containing the rendered markdown content
     */
    public async onMarkdownPostProcessor(element: HTMLElement) {
        console.debug(
            `${this.moduleName}::onMarkdownPostProcessor - Processing rendered html content`
        );

        const resolvedS3ImageLinks =
            this.imageResolver.resolveHtmlElement(element);

        const resolvedS3VideoLinks =
            this.videoResolver.resolveHtmlElement(element);

        const resolvedS3SpanLinks =
            this.spanResolver.resolveHtmlElement(element);

        const resolvedS3AnchorLinks =
            this.anchorResolver.resolveHtmlElement(element);

        const resolvedS3Links: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.objectKeys.entries()),
            ...Array.from(resolvedS3VideoLinks.objectKeys.entries()),
            ...Array.from(resolvedS3SpanLinks.objectKeys.entries()),
            ...Array.from(resolvedS3AnchorLinks.objectKeys.entries()),
        ]);

        const resolvedS3SignLinks: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.signObjectKeys.entries()),
            ...Array.from(resolvedS3VideoLinks.signObjectKeys.entries()),
            ...Array.from(resolvedS3SpanLinks.signObjectKeys.entries()),
            ...Array.from(resolvedS3AnchorLinks.signObjectKeys.entries()),
        ]);

        await this.processS3Links(resolvedS3Links);
        await this.processS3SignLinks(resolvedS3SignLinks);
    }

    /**
     * Work through all resolved S3 links and process them
     *  - If the link is already cached, update the HTML elements with the new resource path
     *  - If the link is not cached, load the file from S3 and update the HTML elements with the new resource path
     *
     * @param resolvedS3Links A map of all resolved S3 links and the corresponding HTML elements
     */
    private async processS3Links(resolvedS3Links: Map<string, HTMLElement[]>) {
        for (const [objectKey, htmlElements] of resolvedS3Links) {
            console.debug(
                `${this.moduleName} - Processing S3 link ${objectKey}`
            );

            const cachedS3Link = this.cache.findItemInCache(objectKey);

            if (cachedS3Link != null) {
                if (
                    this.cache.isS3LinkCacheItemExpired(cachedS3Link.lastUpdate)
                ) {
                    console.debug(
                        `${this.moduleName} - Cache for ${objectKey} expired`
                    );

                    const versionId = await this.getNewestVersionId(
                        objectKey,
                        cachedS3Link
                    );

                    if (versionId == null) {
                        console.error(
                            `${this.moduleName} - Failed to retrieve versionId for objectKey ${objectKey}`
                        );

                        return;
                    }

                    // update cache
                    this.cache.writeItemToCache(objectKey, versionId);

                    if (versionId != cachedS3Link.versionId) {
                        console.log(
                            `${this.moduleName} - New versionId ${versionId} for objectKey ${objectKey}`
                        );

                        const loadedFile = await this.loadS3Item(
                            objectKey,
                            versionId
                        );

                        this.updateLinkReferences(
                            htmlElements,
                            loadedFile,
                            objectKey,
                            versionId
                        );

                        return;
                    }

                    this.updateLinkReferences(
                        htmlElements,
                        cachedS3Link,
                        objectKey,
                        versionId
                    );
                } else {
                    console.debug(`${this.moduleName} - Cache not expired`);
                    // update last checked timestamp
                    this.cache.writeItemToCache(
                        objectKey,
                        cachedS3Link.versionId
                    );
                    this.updateLinkReferences(
                        htmlElements,
                        cachedS3Link,
                        objectKey,
                        cachedS3Link.versionId
                    );
                }
            } else {
                try {
                    const versionId = await this.initNewS3Item(objectKey);
                    const loadedFile = await this.loadS3Item(
                        objectKey,
                        versionId
                    );

                    this.updateLinkReferences(
                        htmlElements,
                        loadedFile,
                        objectKey,
                        versionId
                    );
                } catch (error) {
                    console.error(
                        `${this.moduleName} - Error processing S3 link ${objectKey} ignoring link`,
                        error
                    );
                }
            }
        }
    }

    /**
     * Work through all resolved S3 signLinks and process them
     *  - If the link is already cached, update the HTML elements with the new resource path(signed url)
     *  - If the link is not cached, get a signed URL from S3 and update the HTML elements with the new resource path
     *
     * @param resolvedS3SignLinks A map of all resolved S3 signLinks and the corresponding HTML elements
     */
    private async processS3SignLinks(
        resolvedS3SignLinks: Map<string, HTMLElement[]>
    ) {
        for (const [objectKey, htmlElements] of resolvedS3SignLinks) {
            console.debug(
                `${this.moduleName} - Processing S3 signLink ${objectKey}`
            );

            const cachedS3SignLink = this.cache.findSignedUrlInCache(objectKey);

            if (cachedS3SignLink != null) {
                this.updateSignLinkReferences(
                    htmlElements,
                    objectKey,
                    cachedS3SignLink.signedUrl
                );
            } else {
                try {
                    const signedUrl = await this.getS3SignedUrl(objectKey);
                    if (signedUrl != null) {
                        this.updateSignLinkReferences(
                            htmlElements,
                            objectKey,
                            signedUrl
                        );
                    }
                } catch (error) {
                    console.error(
                        `${this.moduleName} - Error processing S3 signLink ${objectKey} ignoring link`,
                        error
                    );
                }
            }
        }
    }

    /**
     * Update the HTML elements with the new resource path
     *
     * @param htmlElements A list of HTML elements that need to be updated
     * @param resourcePath The new resource path to the local cached file
     */
    private updateLinkReferences(
        htmlElements: HTMLElement[],
        resource: S3Link | TFile,
        objectKey: string,
        versionId: string
    ) {
        console.debug(
            `${this.moduleName}::updateLinkReferences - Updating link references`
        );

        htmlElements.forEach(async (htmlElement) => {
            if (htmlElement instanceof HTMLImageElement) {
                htmlElement.src = await this.getResourcePath(
                    resource,
                    objectKey
                );
            } else if (htmlElement instanceof HTMLVideoElement) {
                htmlElement.autoplay = false;
                htmlElement.src = await this.getResourcePath(
                    resource,
                    objectKey
                );
            } else if (htmlElement instanceof HTMLSpanElement) {
                htmlElement.setAttribute(
                    "src",
                    `${versionId}${path.extname(objectKey)}`
                );
            } else if (htmlElement instanceof HTMLAnchorElement) {
                htmlElement.href = `${
                    Config.OBSIDIAN_APP_LINK_PREFIX
                }${versionId}${path.extname(objectKey)}`;
            }

            htmlElement.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                objectKey
            );
        });
    }

    /**
     * Note: It seems like having await getVaultResourcePath(resource) in the updateLinkReferences method
     * causes span elements to not load properly. It is important that the resourcePath is only retrieved
     * for elements that actually need it.
     *
     * @param resource
     * @param objectKey
     * @returns
     */
    private async getResourcePath(resource: S3Link | TFile, objectKey: string) {
        let resourcePath = "";

        try {
            resourcePath = await getVaultResourcePath(resource);
        } catch (error) {
            sendNotification(
                "Failed to retrieve cached item. Item will be reloaded next time you open the file or reload Obsidian."
            );
            this.cache.removeItemFromCache(objectKey);
        }

        return resourcePath;
    }

    private updateSignLinkReferences(
        htmlElements: HTMLElement[],
        objectKey: string,
        signedUrl: string
    ) {
        console.debug(
            `${this.moduleName}::updateSignLinkReferences - Updating sign link references`
        );

        htmlElements.forEach(async (htmlElement) => {
            if (htmlElement instanceof HTMLImageElement) {
                htmlElement.src = signedUrl;
            } else if (htmlElement instanceof HTMLVideoElement) {
                htmlElement.autoplay = false;
                htmlElement.src = signedUrl;
            } else if (htmlElement instanceof HTMLSpanElement) {
                // not supported
                console.warn(
                    `${this.moduleName}: Span elements are not supported for signed urls`
                );

                return;
            } else if (htmlElement instanceof HTMLAnchorElement) {
                htmlElement.href = signedUrl;
            }

            htmlElement.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                `${Config.S3_SIGNED_LINK_PREFIX}/${objectKey}`
            );
        });
    }

    private async initNewS3Item(objectKey: string): Promise<string> {
        const versionId = await this.client.getLatestObjectVersion(objectKey);

        if (versionId) {
            this.cache.writeItemToCache(objectKey, versionId);

            return versionId;
        }

        throw new Error(
            `Failed to retrieve versionId for objectKey ${objectKey}`
        );
    }

    /**
     * Load the file from S3 and save it to the cache folder
     *
     * @param objectKey
     * @param versionId
     * @returns
     */
    private async loadS3Item(
        objectKey: string,
        versionId: string
    ): Promise<TFile | S3Link> {
        const stream = await this.client.getObject(objectKey, versionId);
        const savedFile = await this.cache.saveFileToCacheFolder(
            objectKey,
            versionId,
            stream
        );

        if (savedFile instanceof TFile) {
            // if the instance is a tfile it means that the file was already cached and was loaded from the cache
            return savedFile as TFile;
        } else {
            // if the instance is a s3link it means that the file was not cached and was loaded from s3
            return new S3Link(objectKey, Date.now(), versionId);
        }
    }

    /**
     * Get a signed URL from S3 for the given objectKey and write it to the cache
     *
     * @param objectKey
     *
     * @returns
     */
    private async getS3SignedUrl(objectKey: string): Promise<string | null> {
        const versionId = await this.client.getLatestObjectVersion(objectKey);

        if (versionId == null) {
            console.debug(
                `${this.moduleName} - Error retrieving versionId for objectKey ${objectKey}`
            );
            return null;
        }
        const signedUrl = await this.client.getSignedUrlForObject(objectKey);
        this.cache.writeSignedUrlToLocalStorage(objectKey, signedUrl);

        return signedUrl;
    }

    /**
     * Retrieves the newest versionId for the given objectKey from S3
     * If the versionId is the same as the one in the cache, the versionId is returned
     *
     * @param objectKey
     * @param s3Link
     *
     * @returns
     */
    private async getNewestVersionId(
        objectKey: string,
        s3Link: S3Link
    ): Promise<string | null> {
        const versionId = await this.client.getLatestObjectVersion(objectKey);

        if (versionId && versionId == s3Link.versionId) {
            console.debug(
                `${this.moduleName} - Item ${objectKey} is still the latest version ${versionId}`
            );

            return s3Link.versionId;
        } else {
            return versionId ?? null;
        }
    }
}
