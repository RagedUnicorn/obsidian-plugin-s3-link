import { App } from "obsidian";

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
            "updateFileLinkReferences - Updating file link references",
            s3FileLink,
            elements
        );

        elements.forEach((htmlElement) => {
            try {
                this.updateElementFileLink(htmlElement, s3FileLink);
            } catch (error) {
                console.error(
                    "updateFileLinkReferences - Error updating element",
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
    private updateElementFileLink(
        htmlElement: HTMLElement,
        s3FileLink: S3FileLink
    ) {
        if (htmlElement instanceof HTMLImageElement) {
            this.updateImageElementTest(htmlElement, s3FileLink);
        } else if (htmlElement instanceof HTMLVideoElement) {
            // TODO
            // updateVideoElement(htmlElement, s3FileLink);
        } else {
            throw new Error(`Unsupported HTML element: ${htmlElement.tagName}`);
        }

        // Add custom attribute to the element for tracking
        htmlElement.setAttribute(
            Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
            `${Config.S3_SIGNED_LINK_PREFIX}/${s3FileLink.objectKey}`
        );
    }

    /**
     * Update the signed link reference for an HTMLImageElement.
     *
     * @param imageElement - The HTMLImageElement to update.
     * @param s3SignedLink - The S3 signed link object.
     */
    private async updateImageElementTest(
        imageElement: HTMLImageElement,
        s3FileLink: S3FileLink
    ) {
        imageElement.src = await this.fileCache.getFileFromCacheFolder(
            s3FileLink
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
            this.updateImageElement(htmlElement, s3SignedLink);
        } else if (htmlElement instanceof HTMLVideoElement) {
            this.updateVideoElement(htmlElement, s3SignedLink);
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
    private updateImageElement(
        imageElement: HTMLImageElement,
        s3Link: S3SignedLink
    ) {
        imageElement.src = s3Link.signedUrl;
    }

    /**
     * Update the signed link reference for an HTMLVideoElement.
     *
     * @param videoElement - The HTMLVideoElement to update.
     * @param s3SignedLink - The S3 signed link object.
     */
    private updateVideoElement(
        videoElement: HTMLVideoElement,
        s3SignedLink: S3SignedLink
    ) {
        videoElement.autoplay = false; // Ensure autoplay is disabled for videos
        videoElement.src = s3SignedLink.signedUrl;
    }
}
