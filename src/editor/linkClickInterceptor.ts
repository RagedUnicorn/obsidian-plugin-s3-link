import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import Config from "../config/config";

export interface LinkInfo {
    text: string;
    url: string;
    from: number;
    to: number;
    type: "markdown";
}

/**
 * Creates a CodeMirror extension that intercepts clicks on S3 links in editing mode.
 */
export function createLinkClickInterceptor(
    onS3LinkClick: (objectKey: string, isSigned: boolean) => void
): Extension {
    return EditorView.domEventHandlers({
        click: (event: MouseEvent, view: EditorView) => {
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos === null) return false;

            // Check if we clicked on a link
            const linkInfo = getLinkAtPosition(view, pos);
            if (linkInfo) {
                const parts = linkInfo.url.split(Config.S3_LINK_SPLITTER);
                const linkPrefix = parts[0];
                const objectKey = parts
                    .slice(1)
                    .join(Config.S3_LINK_SPLITTER);

                const isS3Link =
                    linkPrefix === Config.S3_FILE_LINK_PREFIX ||
                    linkPrefix === Config.S3_SIGNED_LINK_PREFIX;

                if (isS3Link && objectKey) {
                    event.preventDefault();
                    event.stopPropagation();

                    const isSigned =
                        linkPrefix === Config.S3_SIGNED_LINK_PREFIX;
                    onS3LinkClick(objectKey, isSigned);

                    return true;
                }
            }

            return false;
        },
    });
}

/**
 * Detects if a position is within a link and returns link information.
 */
function getLinkAtPosition(view: EditorView, pos: number): LinkInfo | null {
    const state = view.state;
    const tree = syntaxTree(state);
    const doc = state.doc;

    // Find the node at the clicked position
    let node = tree.resolveInner(pos);

    // Walk up the tree to find link-related nodes
    while (node) {
        const nodeText = doc.sliceString(node.from, node.to);

        // Check for markdown links [text](url)
        if (node.name === "Link") {
            const match = nodeText.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (match) {
                return {
                    text: match[1],
                    url: match[2],
                    from: node.from,
                    to: node.to,
                    type: "markdown",
                };
            }
        }

        // Check parent node
        if (!node.parent) break;
        node = node.parent;
    }

    // Fallback: regex-based detection for edge cases
    const line = state.doc.lineAt(pos);
    const lineText = line.text;
    const linePos = pos - line.from;

    // Check for markdown links
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = markdownLinkRegex.exec(lineText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (linePos >= start && linePos <= end) {
            return {
                text: match[1],
                url: match[2],
                from: line.from + start,
                to: line.from + end,
                type: "markdown",
            };
        }
    }

    return null;
}