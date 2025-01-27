import { MarkdownView } from "obsidian";

/**
 * Reloads the current view.
 *
 * @param markdownView
 */
export function reloadCurrentView(markdownView: MarkdownView): void {
    const mode = markdownView.getMode();

    if (mode === "preview") {
        // force the preview to re-render
        markdownView.previewMode?.rerender(true);
    } else {
        // Reset view data to trigger re-rendering
        const content = markdownView.getViewData();
        markdownView.setViewData(content, false);
    }
}
