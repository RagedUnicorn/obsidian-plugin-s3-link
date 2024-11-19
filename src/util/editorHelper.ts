import { MarkdownView, App } from "obsidian";

function getCurrentEditorMode(app: App): string {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
        return "no-active-editor";
    }
    return view.getMode();
}

export function isEditorModePreview(app: App): boolean {
    return getCurrentEditorMode(app) === "preview";
}

export function isEditorModeSource(app: App): boolean {
    return getCurrentEditorMode(app) === "source";
}
