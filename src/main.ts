import { Plugin } from "obsidian";
import { ViewPlugin } from "@codemirror/view";
import { debounce } from "lodash"; // Import lodash debounce function for throttling

export default class SimpleImagePlugin extends Plugin {
    // TODO name
    onload() {
        this.registerEditorExtension(this.createCodeMirrorExtension(this.app));
    }

    createCodeMirrorExtension(app) {
        return ViewPlugin.fromClass(
            class {
                app;
                mutationObserver;
                throttledUpdateImages;

                constructor(view) {
                    console.log("Loaded obsidian-plugin-s3-link");
                    this.app = app;
                    this.throttledUpdateImages = debounce(
                        this.updateImages,
                        100
                    ); // Throttle the updates

                    this.updateImages(view); // Update images when the plugin is first loaded

                    // Set up a MutationObserver to monitor when new images are added to the DOM
                    this.mutationObserver = new MutationObserver(
                        (mutations) => {
                            mutations.forEach((mutation) => {
                                if (mutation.addedNodes.length) {
                                    this.throttledUpdateImages(view);
                                }
                            });
                        }
                    );

                    // Start observing the view's DOM for changes
                    this.mutationObserver.observe(view.dom, {
                        childList: true,
                        subtree: true,
                    });
                }

                update(update) {
                    this.throttledUpdateImages(update.view);
                    // Trigger image update when document changes, viewport changes, or focus changes
                    if (
                        update.docChanged ||
                        update.viewportChanged ||
                        update.focusChanged
                    ) {
                        this.throttledUpdateImages(update.view);
                    }
                }

                updateImages(view) {
                    // Find all image elements with s3-sign links rendered by Obsidian
                    const imgElements = view.dom.querySelectorAll(
                        "img[src^='s3-sign:']"
                    );

                    imgElements.forEach((img) => {
                        console.log("Updating image", img);
                        const s3Link = img.getAttribute("src");

                        // If the image has already been processed, skip it

                        const localImagePath = this.resolveImagePath(
                            "assets/s3_image_test_jpg_1.jpg"
                        );

                        // Replace the src attribute with the resolved path
                        img.setAttribute("src", localImagePath);
                        console.log("Resolved path", localImagePath);
                    });
                }

                // Helper method to resolve the image path using Obsidian's internal API
                resolveImagePath(path) {
                    return this.app.vault.adapter.getResourcePath(path);
                }

                destroy() {
                    // Disconnect the MutationObserver when the plugin is destroyed
                    this.mutationObserver.disconnect();
                }
            }
        );
    }

    onunload() {
        // Clean up when the plugin is unloaded
    }
}
