import { TFile } from "obsidian";
import { Cache } from "./cache";
import { Config } from "./config";
import { getVaultResourcePath } from "./obsidianHelper";
import { S3NetworkExecutor } from "./s3NetworkExecutor";
import { PluginSettings } from "./settings/settings";
import { S3ImageResolver } from "./resolver/s3ImageResolver";
import { S3VideoResolver } from "./resolver/s3VideoResolver";
import { S3SpanResolver } from "./resolver/s3SpanResolver";
import { S3AnchorResolver } from "./resolver/s3AnchorResolver";
import * as path from "path";
import S3LinkPlugin from "./main";

export class MarkdownPostProcessorListener {
    private readonly moduleName = "MarkdownPostProcessorListener";
    private s3NetworkExecutor: S3NetworkExecutor;
    private s3Cache: Cache;
    private imageResolver: S3ImageResolver;
    private videoResolver: S3VideoResolver;
    private spanResolver: S3SpanResolver;
    private anchorResolver: S3AnchorResolver;
    private pluginSettings: PluginSettings;

    constructor(
        plugin: S3LinkPlugin,
        s3Cache: Cache,
        settings: PluginSettings
    ) {
        this.s3Cache = s3Cache;
        this.s3NetworkExecutor = new S3NetworkExecutor(settings, plugin);
        this.imageResolver = new S3ImageResolver();
        this.videoResolver = new S3VideoResolver();
        this.spanResolver = new S3SpanResolver();
        this.anchorResolver = new S3AnchorResolver();
        this.pluginSettings = settings;
        this.s3NetworkExecutor.initializeS3Client(this.pluginSettings);
    }

    /**
     * Callback for the settings tab. Invoked when the settings are changed.
     *
     * @param settings PluginSettings containing the new settings
     */
    public onSettingsChanged(settings: PluginSettings) {
        console.debug("Settings changed, reinitializing s3Client...");
        this.s3NetworkExecutor.initializeS3Client(settings);
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

            const cachedS3Link = this.s3Cache.findItemInCache(objectKey);

            if (cachedS3Link != null) {
                const resourcePath = getVaultResourcePath(cachedS3Link);

                this.updateLinkReferences(
                    htmlElements,
                    resourcePath,
                    cachedS3Link.objectKey,
                    cachedS3Link.versionId
                );
            } else {
                try {
                    const versionId = await this.initNewS3Item(objectKey);
                    const loadedFile = await this.loadS3Item(
                        objectKey,
                        versionId
                    );

                    const resourcePath = getVaultResourcePath(loadedFile);

                    this.updateLinkReferences(
                        htmlElements,
                        resourcePath,
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

            const cachedS3SignLink =
                this.s3Cache.findSignedUrlInCache(objectKey);

            if (cachedS3SignLink != null) {
                this.updateSignLinkReferences(
                    htmlElements,
                    cachedS3SignLink.signedUrl
                );
            } else {
                try {
                    const signedUrl = await this.getS3SignedUrl(objectKey);

                    this.updateSignLinkReferences(htmlElements, signedUrl);
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
        resourcePath: string,
        objectKey: string,
        versionId: string
    ) {
        console.debug(
            `${this.moduleName}::updateLinkReferences - Updating link references`
        );

        htmlElements.forEach((htmlElement) => {
            if (htmlElement instanceof HTMLImageElement) {
                htmlElement.src = resourcePath;
            } else if (htmlElement instanceof HTMLVideoElement) {
                htmlElement.autoplay = false;
                htmlElement.src = resourcePath;
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
        });
    }

    private updateSignLinkReferences(
        htmlElements: HTMLElement[],
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
        });
    }

    private async initNewS3Item(objectKey: string): Promise<string> {
        const versionId = await this.s3NetworkExecutor.getLatestObjectVersion(
            objectKey
        );

        if (versionId) {
            this.s3Cache.initNewItemToCache(objectKey, versionId);

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
    ): Promise<TFile> {
        const objectData = await this.s3NetworkExecutor.getObject(objectKey);

        return this.s3Cache.saveFileToCacheFolder(
            objectKey,
            versionId,
            objectData
        );
    }

    /**
     * Get a signed URL from S3 for the given objectKey and write it to the cache
     *
     * @param objectKey
     *
     * @returns
     */
    private async getS3SignedUrl(objectKey: string): Promise<string> {
        const signedUrl = await this.s3NetworkExecutor.getSignedUrlForObject(
            objectKey
        );
        this.s3Cache.writeSignedUrlToLocalStorage(objectKey, signedUrl);

        return signedUrl;
    }
}
