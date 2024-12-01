import { App } from "obsidian";

import Config from "../config";
import FileCache from "../cache/fileCache";
import { emitter } from "../event/event";
import {
    EVENT_FILE_LINK_PROCESSED,
    EVENT_SIGN_LINK_PROCESSED,
} from "../event/event";
import S3FileLink from "../model/s3FileLink";
import S3SignedLink from "../model/s3SignedLink";
import {
    DISPLAY_TYPE,
    getDisplayTypeByObjectKey,
} from "../constants/supportedFileTypes";

export default class HtmlProcessor {
    private readonly moduleName = "HtmlProcessor";

    constructor(private fileCache: FileCache, private app: App) {
        this.setupEventListeners();

        console.info(`${this.moduleName}::constructor - HtmlProcessor created`);
    }

    /**
     * Set up event listeners to receive processed links. Processed links are links that
     * where resolved to their respective signed s3 or file s3 links.
     *
     */
    private setupEventListeners() {
        emitter.on(EVENT_SIGN_LINK_PROCESSED, ({ elements, s3SignedLink }) => {
            console.debug(
                `${this.moduleName}::setupEventListeners - Received Event signLinkProcessed`,
                elements,
                s3SignedLink
            );
            this.updateSignedLinkReferences(elements, s3SignedLink);
        });

        emitter.on(EVENT_FILE_LINK_PROCESSED, ({ elements, s3FileLink }) => {
            console.debug(
                `${this.moduleName}::setupEventListeners - Received Event fileLinkProcessed`,
                elements,
                s3FileLink
            );
            this.updateFileLinkReferences(elements, s3FileLink);
        });

        console.info(
            `${this.moduleName}::setupEventListeners - Event listeners set up`
        );
    }

    /**
     * Update file link references for a list of HTML elements.
     *
     * @param elements - Array of HTML elements to update.
     * @param s3FileLink - The S3 file link object.
     */
    public updateFileLinkReferences(
        elements: HTMLElement[],
        s3FileLink: S3FileLink
    ) {
        console.debug(
            `${this.moduleName}::updateFileLinkReferences - Updating file link references`,
            s3FileLink,
            elements
        );

        elements.forEach((htmlElement) => {
            try {
                this.updateElementFileLink(htmlElement, s3FileLink);
            } catch (error) {
                console.error(
                    `${this.moduleName}::updateFileLinkReferences - Error updating element`,
                    htmlElement,
                    error
                );
            }
        });
    }

    /**
     * Update a single HTML element's file link reference.
     *
     * @param htmlElement - The HTML element to update.
     * @param s3FileLink - The S3 file link object.
     */
    private async updateElementFileLink(
        htmlElement: HTMLElement,
        s3FileLink: S3FileLink
    ) {
        let source = await this.fileCache.getFileFromCacheFolder(s3FileLink);

        if (this.isElementProcessed(htmlElement)) return;

        if (htmlElement instanceof HTMLImageElement) {
            this.updateImageElement(htmlElement, source);
        } else if (htmlElement instanceof HTMLVideoElement) {
            this.updateVideoElement(htmlElement, source);
        } else if (htmlElement instanceof HTMLAudioElement) {
            this.updateAudioElement(htmlElement, source);
        } else if (htmlElement instanceof HTMLSpanElement) {
            this.updateSpanElement(htmlElement, source, s3FileLink.objectKey);
        } else if (htmlElement instanceof HTMLDivElement) {
            this.updateDivElement(htmlElement, source);
        } else {
            throw new Error(`Unsupported HTML element: ${htmlElement.tagName}`);
        }

        // Add custom attribute to the element for tracking
        htmlElement.setAttribute(
            Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
            `${Config.S3_FILE_LINK_PREFIX}/${s3FileLink.objectKey}`
        );

        this.markElementAsProcessed(htmlElement);
    }

    /**
     * Update signed link references for a list of HTML elements.
     *
     * @param elements - Array of HTML elements to update.
     * @param s3SignedLink - The S3 signed link object.
     */
    public updateSignedLinkReferences(
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
                this.updateElementSignedLink(htmlElement, s3SignedLink);
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
    private updateElementSignedLink(
        htmlElement: HTMLElement,
        s3SignedLink: S3SignedLink
    ) {
        if (this.isElementProcessed(htmlElement)) return;

        if (htmlElement instanceof HTMLImageElement) {
            this.updateImageElement(htmlElement, s3SignedLink.signedUrl);
        } else if (htmlElement instanceof HTMLVideoElement) {
            this.updateVideoElement(htmlElement, s3SignedLink.signedUrl);
        } else if (htmlElement instanceof HTMLAudioElement) {
            this.updateAudioElement(htmlElement, s3SignedLink.signedUrl);
        } else if (htmlElement instanceof HTMLSpanElement) {
            this.updateSpanElement(
                htmlElement,
                s3SignedLink.signedUrl,
                s3SignedLink.objectKey
            );
        } else if (htmlElement instanceof HTMLDivElement) {
            this.updateDivElement(htmlElement, s3SignedLink.signedUrl);
        } else {
            throw new Error(`Unsupported HTML element: ${htmlElement.tagName}`);
        }

        // Add custom attribute to the element for tracking
        htmlElement.setAttribute(
            Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
            `${Config.S3_SIGNED_LINK_PREFIX}/${s3SignedLink.objectKey}`
        );

        this.markElementAsProcessed(htmlElement);
    }

    /**
     * Update the src reference for an HTMLImageElement.
     *
     * @param imageElement - The HTMLImageElement to update.
     * @param source - Resource path to the file or an S3 signed link.
     */
    private updateImageElement(imageElement: HTMLImageElement, source: string) {
        imageElement.src = source;
    }

    /**
     * Update the src reference for an HTMLVideoElement.
     *
     * @param videoElement - The HTMLVideoElement to update.
     * @param source - Resource path to the file or an S3 signed link.
     */
    private updateVideoElement(videoElement: HTMLVideoElement, source: string) {
        videoElement.src = source;
        videoElement.controls = true;
        videoElement.autoplay = false; // Ensure autoplay is disabled for videos
    }

    /**
     * Update the src reference for an HTMLAudioElement.
     *
     * @param audioElement - The HTMLAudioElement to update.
     * @param source - Resource path to the file or an S3 signed link.
     */
    private updateAudioElement(audioElement: HTMLAudioElement, source: string) {
        audioElement.src = source;
        audioElement.controls = true;
        audioElement.autoplay = false; // Ensure autoplay is disabled for audio
    }

    /**
     * Update the span element with the new source.
     *
     * @param spanElement - The HTMLSpanElement to update.
     * @param source - Resource path to the file or an S3 signed link.
     */
    private updateSpanElement(
        spanElement: HTMLSpanElement,
        source: string,
        objectKey: string
    ) {
        const displayType = getDisplayTypeByObjectKey(objectKey);

        switch (displayType) {
            case DISPLAY_TYPE.IMAGE: {
                const imageTag = this.createMediaElement<HTMLImageElement>(
                    "img",
                    source
                );
                spanElement.replaceWith(imageTag);

                break;
            }
            case DISPLAY_TYPE.VIDEO: {
                if (objectKey.endsWith(".webm")) {
                    console.debug(
                        `${this.moduleName}::updateSpanElement - WebM file detected`
                    );

                    const videoTag = this.createMediaElement<HTMLVideoElement>(
                        "video",
                        source
                    );

                    videoTag.onloadedmetadata = () => {
                        if (videoTag.videoWidth > 0) {
                            console.debug(
                                `${this.moduleName}::updateSpanElement - WebM file detected as Video file.`
                            );

                            spanElement.replaceWith(videoTag);
                        } else {
                            console.debug(
                                `${this.moduleName}::updateSpanElement - WebM file detected as Audio file.`
                            );

                            const audioTag =
                                this.createMediaElement<HTMLAudioElement>(
                                    "audio",
                                    source
                                );
                            spanElement.replaceWith(audioTag);
                        }
                    };
                } else {
                    const videoTag = this.createMediaElement<HTMLVideoElement>(
                        "video",
                        source
                    );
                    spanElement.replaceWith(videoTag);
                }

                break;
            }
            case DISPLAY_TYPE.AUDIO: {
                const audioTag = this.createMediaElement<HTMLAudioElement>(
                    "audio",
                    source
                );
                spanElement.replaceWith(audioTag);

                break;
            }
            case DISPLAY_TYPE.INVALID:
                console.error(
                    `${this.moduleName}::updateSpanElement - Invalid display type`,
                    objectKey
                );

                break;
        }
    }

    /**
     * Update the div element with the new source.
     *
     * TODO this is used by codemirror TODO not yet working
     *
     * @param divElement - The HTMLDivElement to update.
     * @param source - Resource path to the file or an S3 signed link.
     */
    private updateDivElement(divElement: HTMLDivElement, source: string) {
        if (this.isElementProcessed(divElement)) return;

        // TODO it depends on the source what kind of element we need to generate
        // it could also be that we want to display an audio file
        console.error("updateDivElement", divElement);
        // divElement.setAttribute("src", "processed"); // this is key TODO if we don't set this, the div will be processed again creating a loop
        // the same might be required in other places TODO
        const videoTag = document.createElement("video");
        videoTag.src = source;
        videoTag.controls = true;
        videoTag.autoplay = false;

        // removing the obsidian file not found message
        while (divElement.firstChild) {
            divElement.removeChild(divElement.firstChild);
        }
        // Replace the original embed with the new video tag
        divElement.appendChild(videoTag);
        // TODO not yet sure how this works if I change the element
        this.markElementAsProcessed(divElement);
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
     */
    private markElementAsProcessed(element: HTMLElement) {
        element.setAttribute(Config.S3_PLUGIN_PROCESSED, "true");
    }

    /**
     * Create a media element with the given tag name and source.
     *
     * @param tagName - The tag name of the media element.
     * @param src - The source of the media element.
     *
     * @returns The created media element.
     */
    private createMediaElement<T extends HTMLMediaElement | HTMLImageElement>(
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
}
