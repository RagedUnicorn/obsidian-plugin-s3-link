import { App } from "obsidian";

import path from "path";

import Config from "../config";
import S3FileLink from "../model/s3FileLink";
import S3SignedLink from "../model/s3SignedLink";
import FileCache from "../cache/fileCache";
import { emitter } from "../event/event";

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
        emitter.on("signLinkProcessed", ({ elements, s3SignedLink }) => {
            console.debug(
                `${this.moduleName}::setupEventListeners - Received Event signLinkProcessed`,
                elements,
                s3SignedLink
            );
            this.updateSignedLinkReferences(elements, s3SignedLink);
        });

        emitter.on("fileLinkProcessed", ({ elements, s3FileLink }) => {
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
        console.error("htmlElement", htmlElement);
        if (htmlElement instanceof HTMLImageElement) {
            this.updateImageElement(htmlElement, source);
        } else if (htmlElement instanceof HTMLVideoElement) {
            this.updateVideoElement(htmlElement, source);
        } else if (htmlElement instanceof HTMLAudioElement) {
            this.updateAudioElement(htmlElement, source);
        } else if (htmlElement instanceof HTMLSpanElement) {
            this.updateSpanElement(htmlElement, source);
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
        if (htmlElement instanceof HTMLImageElement) {
            this.updateImageElement(htmlElement, s3SignedLink.signedUrl);
        } else if (htmlElement instanceof HTMLVideoElement) {
            this.updateVideoElement(htmlElement, s3SignedLink.signedUrl);
        } else if (htmlElement instanceof HTMLAudioElement) {
            this.updateAudioElement(htmlElement, s3SignedLink.signedUrl);
        } else if (htmlElement instanceof HTMLSpanElement) {
            this.updateSpanElement(htmlElement, s3SignedLink.signedUrl);
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
        videoElement.autoplay = false; // Ensure autoplay is disabled for videos
        videoElement.src = source;
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
        audioElement.autoplay = false;
    }

    /**
     * Update the span element with the new source.
     *
     * @param spanElement - The HTMLSpanElement to update.
     * @param source - Resource path to the file or an S3 signed link.
     */
    private updateSpanElement(spanElement: HTMLSpanElement, source: string) {
        // TODO it depends on the source what kind of element we need to generate
        // it could also be that we want to display an audio file
        const videoTag = document.createElement("video");
        videoTag.src = source;
        videoTag.controls = true;

        // Replace the original embed with the new video tag
        spanElement.replaceWith(videoTag);
    }

    /**
     * Update the div element with the new source.
     *
     * @param divElement - The HTMLDivElement to update.
     * @param source - Resource path to the file or an S3 signed link.
     */
    private updateDivElement(divElement: HTMLDivElement, source: string) {
        if (divElement.hasAttribute("s3-plugin-proccess")) {
            console.error("htmlElement already processed", divElement);
            return;
        }

        // TODO it depends on the source what kind of element we need to generate
        // it could also be that we want to display an audio file
        console.error("updateDivElement", divElement);
        // divElement.setAttribute("src", "processed"); // this is key TODO if we don't set this, the div will be processed again creating a loop
        // the same might be required in other places TODO
        const videoTag = document.createElement("video");
        videoTag.src = source;
        videoTag.controls = true;

        while (divElement.firstChild) {
            divElement.removeChild(divElement.firstChild);
        }
        // Replace the original embed with the new video tag
        divElement.appendChild(videoTag);
        // TODO not yet sure how this works if I change the element
        divElement.setAttribute("s3-plugin-proccess", "true"); // TODO work done
    }
}
