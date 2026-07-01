import { Plugin } from "obsidian";
import Config from "../config/config";

export default class LinkClickHandler {
    private readonly moduleName = "LinkClickHandler";
    private clickHandler: ((event: MouseEvent) => void) | null = null;

    constructor(
        private plugin: Plugin,
        public onS3LinkClick: (objectKey: string, isSigned: boolean) => void
    ) {
        console.info(
            `${this.moduleName}::constructor - LinkClickHandler created`
        );
    }

    /**
     * Register a global click handler for S3 links.
     * This intercepts clicks on anchor elements with S3 protocol links.
     */
    public register(): void {
        console.info(
            `${this.moduleName}::register - Registering link click handler`
        );

        // Create the click handler if it doesn't exist
        if (!this.clickHandler) {
            this.clickHandler = this.handleClick.bind(this);
        }

        // Register a single global click handler on the workspace container
        // This avoids duplicate registrations
        const workspaceContainer = this.plugin.app.workspace.containerEl;
        this.plugin.registerDomEvent(
            workspaceContainer,
            "click",
            this.clickHandler,
            { capture: true } // Use capture phase to intercept before default handling
        );
    }

    /**
     * Handle click events on the document.
     * Intercepts S3 protocol links and processes them.
     */
    private handleClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const anchor = target.closest("a") as HTMLAnchorElement;

        if (!anchor) return;

        const href = anchor.getAttribute("href");
        if (!href) return;

        // Check if this is an S3 link
        const { prefix, objectKey } = this.parseS3Link(href);

        if (prefix && objectKey) {
            console.debug(
                `${this.moduleName}::handleClick - Intercepted S3 link click:`,
                { prefix, objectKey, href }
            );

            // Prevent default navigation
            event.preventDefault();
            event.stopPropagation();

            // Handle the S3 link
            const isSigned = prefix === Config.S3_SIGNED_LINK_PREFIX;
            this.onS3LinkClick(objectKey, isSigned);
        }
    }

    /**
     * Parse an S3 link href to extract the prefix and object key.
     * Handles cases like "s3:path/to/file" and "s3-sign:path/to/file"
     */
    private parseS3Link(href: string): {
        prefix: string | null;
        objectKey: string | null;
    } {
        if (!href) return { prefix: null, objectKey: null };

        // Parse S3 links
        const parts = href.split(Config.S3_LINK_SPLITTER);
        const prefix = parts[0];

        if (
            prefix === Config.S3_FILE_LINK_PREFIX ||
            prefix === Config.S3_SIGNED_LINK_PREFIX
        ) {
            const objectKey = parts.slice(1).join(Config.S3_LINK_SPLITTER);
            return {
                prefix,
                objectKey: objectKey || null,
            };
        }

        return { prefix: null, objectKey: null };
    }

    /**
     * Unregister the click handler.
     * Called when the plugin is unloaded.
     */
    public unregister(): void {
        console.info(
            `${this.moduleName}::unregister - Unregistering link click handler`
        );
        // Obsidian handles cleanup of registerDomEvent automatically
    }
}
