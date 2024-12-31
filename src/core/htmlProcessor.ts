import { App } from "obsidian";

import Config from "../config/config";
import FileCache from "../cache/fileCache";
import {
    emitter,
    EVENT_FILE_LINK_PROCESSED,
    EVENT_SIGN_LINK_PROCESSED,
} from "../event/event";
import S3FileLink from "./s3FileLink";
import S3SignedLink from "./s3SignedLink";
import {
    DISPLAY_TYPE,
    getDisplayTypeByObjectKey,
} from "../constants/supportedFileTypes";

type HTMLElementWithSource =
    | HTMLImageElement
    | HTMLVideoElement
    | HTMLAudioElement;

export default class HtmlProcessor {
    private readonly moduleName = "HtmlProcessor";

    constructor(private fileCache: FileCache, private app: App) {
        this.setupEventListeners();

        console.info(`${this.moduleName}::constructor - HtmlProcessor created`);
    }

    /**
     * Set up event listeners to receive processed links.
     * Processed links are links that were resolved to their respective signed s3 or file s3 links.
     */
    private setupEventListeners() {
        emitter.on(EVENT_SIGN_LINK_PROCESSED, ({ elements, s3SignedLink }) => {
            console.debug(
                `${this.moduleName}::setupEventListeners - Received Event EVENT_SIGN_LINK_PROCESSED`,
                elements,
                s3SignedLink
            );
            this.processElements(
                elements,
                s3SignedLink,
                this.updateElementSignedLink.bind(this)
            );
        });

        emitter.on(EVENT_FILE_LINK_PROCESSED, ({ elements, s3FileLink }) => {
            console.debug(
                `${this.moduleName}::setupEventListeners - Received Event EVENT_FILE_LINK_PROCESSED`,
                elements,
                s3FileLink
            );
            this.processElements(
                elements,
                s3FileLink,
                this.updateElementFileLink.bind(this)
            );
        });

        console.info(
            `${this.moduleName}::setupEventListeners - Event listeners set up`
        );
    }

    /**
     * Process all elements that have been resolved to a s3 signed or file link.
     *
     * @param elements - The elements to process.
     * @param link - The s3 signed or file link.
     * @param updater - The function to update the element.
     */
    private async processElements<T extends S3FileLink | S3SignedLink>(
        elements: HTMLElement[],
        link: T,
        updater: (htmlElement: HTMLElement, link: T) => Promise<void> | void
    ) {
        for (const htmlElement of elements) {
            try {
                await updater(htmlElement, link);
            } catch (error) {
                console.error(
                    `${this.moduleName}::processElements - Error processing element`,
                    htmlElement,
                    error
                );
            }
        }
    }

    /**
     * Update the source of the given HTML element to the given s3 file link.
     *
     * @param htmlElement - The HTML element to update.
     * @param s3FileLink - The s3 file link to update the element with.
     */
    private async updateElementFileLink(
        htmlElement: HTMLElement,
        s3FileLink: S3FileLink
    ) {
        if (this.isElementProcessed(htmlElement)) return;

        try {
            const source = await this.fileCache.getFileFromCacheFolder(
                s3FileLink
            );
            this.updateElement(htmlElement, source, s3FileLink.objectKey);
            this.markElementAsProcessed(
                htmlElement,
                `${Config.S3_FILE_LINK_PREFIX}/${s3FileLink.objectKey}`
            );
        } catch (error) {
            console.error(
                `${this.moduleName}::updateElementFileLink - Error getting file from cache`,
                s3FileLink,
                error
            );
        }
    }

    /**
     * Update the source of the given HTML element to the given signed s3 link.
     *
     * @param htmlElement - The HTML element to update.
     * @param s3SignedLink - The signed s3 link to update the element with.
     */
    private updateElementSignedLink(
        htmlElement: HTMLElement,
        s3SignedLink: S3SignedLink
    ) {
        if (this.isElementProcessed(htmlElement)) return;

        this.updateElement(
            htmlElement,
            s3SignedLink.signedUrl,
            s3SignedLink.objectKey
        );
        this.markElementAsProcessed(
            htmlElement,
            `${Config.S3_SIGNED_LINK_PREFIX}/${s3SignedLink.objectKey}`
        );
    }

    /**
     * Update the source of the given HTML element to the given source.
     *
     * @param htmlElement - The HTML element to update.
     * @param source - The source to update the element with.
     * @param objectKey - The object key of the source.
     */
    private updateElement(
        htmlElement: HTMLElement,
        source: string,
        objectKey: string
    ) {
        if (htmlElement instanceof HTMLImageElement) {
            this.updateMediaElement(htmlElement, source);
        } else if (
            htmlElement instanceof HTMLVideoElement ||
            htmlElement instanceof HTMLAudioElement
        ) {
            this.updateMediaElement(htmlElement, source, true);
        } else if (htmlElement instanceof HTMLSpanElement) {
            this.updateSpanElement(htmlElement, source, objectKey);
        } else if (htmlElement instanceof HTMLDivElement) {
            this.updateDivElement(htmlElement, source, objectKey);
        } else {
            throw new Error(
                `Unsupported HTML element: ${
                    (htmlElement as HTMLElement).tagName
                }`
            );
        }
    }

    /**
     * Update the source of the given media element to the given source.
     *
     * @param element - The media element to update.
     * @param source - The source to update the element with.
     * @param withControls - Whether to add controls to the media element.
     */
    private updateMediaElement(
        element: HTMLImageElement | HTMLVideoElement | HTMLAudioElement,
        source: string,
        withControls = false
    ) {
        element.src = source;
        if (
            withControls &&
            (element instanceof HTMLVideoElement ||
                element instanceof HTMLAudioElement)
        ) {
            element.controls = true;
            element.autoplay = false;
        }
    }

    /**
     * Update the source of the given span element to the given source.
     *
     * @param spanElement - The span element to update.
     * @param source - The source to update the element with.
     * @param objectKey - The object key of the source.
     */
    private updateSpanElement(
        spanElement: HTMLSpanElement,
        source: string,
        objectKey: string
    ) {
        const displayType = getDisplayTypeByObjectKey(objectKey);
        const newElement = this.createMediaElementFromDisplayType(
            displayType,
            source,
            objectKey
        );

        if (newElement) {
            spanElement.replaceWith(newElement);
        } else {
            console.error(
                `${this.moduleName}::updateSpanElement - Invalid display type`,
                objectKey
            );
        }
    }

    /**
     * Update the source of the given div element to the given source.
     *
     * @param divElement - The div element to update.
     * @param source - The source to update the element with.
     * @param objectKey - The object key of the source.
     */
    private updateDivElement(
        divElement: HTMLDivElement,
        source: string,
        objectKey: string
    ) {
        const displayType = getDisplayTypeByObjectKey(objectKey);
        const newElement = this.createMediaElementFromDisplayType(
            displayType,
            source,
            objectKey
        );

        if (newElement) {
            divElement.textContent = "";
            divElement.setAttribute(
                "class",
                `internal-embed media-embed ${displayType.toLowerCase()}-embed is-loaded`
            );
            divElement.appendChild(newElement);
        } else {
            console.error(
                `${this.moduleName}::updateDivElement - Invalid display type`,
                objectKey
            );
        }
    }

    /**
     * Create a media element based on the display type of the object key.
     *
     * @param displayType - The display type of the object key.
     * @param source - The source of the media element.
     * @param objectKey - The object key of the source.
     *
     * @returns The created media element.
     */
    private createMediaElementFromDisplayType(
        displayType: DISPLAY_TYPE,
        source: string,
        objectKey: string
    ): HTMLElementWithSource | null {
        switch (displayType) {
            case DISPLAY_TYPE.IMAGE:
                return this.createMediaElementWithSource<HTMLImageElement>(
                    "img",
                    source
                );
            case DISPLAY_TYPE.VIDEO:
                if (objectKey.endsWith(".webm")) {
                    return this.createWebmMediaElement(source);
                }
                return this.createMediaElementWithSource<HTMLVideoElement>(
                    "video",
                    source
                );
            case DISPLAY_TYPE.AUDIO:
                return this.createMediaElementWithSource<HTMLAudioElement>(
                    "audio",
                    source
                );
            case DISPLAY_TYPE.INVALID:
                console.error(
                    `${this.moduleName}::createMediaElementFromDisplayType - Invalid display type`,
                    objectKey
                );
                return null;
        }
    }

    /**
     * Create a media element for a webm file.
        const videoTag = this.createMediaElementWithSource<HTMLVideoElement>(
     * @param source - The source of the media element.
     *
     * @returns The created media element.
     */
    private createWebmMediaElement(
        source: string
    ): HTMLVideoElement | HTMLAudioElement {
        const videoTag = this.createMediaElementWithSource<HTMLVideoElement>(
            "video",
            source
        );

        videoTag.onloadedmetadata = () => {
            if (videoTag.videoWidth === 0) {
                const audioTag =
                    this.createMediaElementWithSource<HTMLAudioElement>(
                        "audio",
                        source
                    );
                videoTag.replaceWith(audioTag);
            }
        };

        return videoTag;
    }

    /**
     * Create a media element with the given tag name and source.
     *
     * @param tagName - The tag name of the media element.
     * @param src - The source of the media element.
     *
     * @returns The created media element.
     */
    private createMediaElementWithSource<T extends HTMLElementWithSource>(
        tagName: string,
        src: string
    ): T {
        const element = document.createElement(tagName) as T;
        element.src = src;

        if ("controls" in element) {
            (element as HTMLMediaElement).controls = true;
        }

        return element;
    }

    /**
     * Check if an element has already been processed by the plugin.
     * @param element - The HTML element to check.
     * @returns True if the element has been processed, false otherwise.
     */
    private isElementProcessed(element: HTMLElement): boolean {
        return element.hasAttribute(Config.S3_PLUGIN_PROCESSED);
    }

    /**
     * Mark an element as processed by the plugin.
     * @param element - The HTML element to mark as processed.
     * @param attributeValue - The value to set for the processed attribute
     */
    private markElementAsProcessed(
        element: HTMLElement,
        attributeValue: string
    ) {
        element.setAttribute(Config.S3_PLUGIN_PROCESSED, "true");
        element.setAttribute(
            Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
            attributeValue
        );
    }
}
