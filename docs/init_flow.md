# Init Flow

> Overview: This flow describes how document changes, openings, and parts brought into view are processed.

This is the very start of the proccess. The process always starts with an HTML-Change event. The process show a very high level
of the process of receiving an event in one of CodeMirror extension or MarkdownPost processor and processing the event.

```mermaid
---
title: Obsidian Plugin - Event Flow Start
---

flowchart TD
    %% Start
    eventNode@{ shape: circle, label: "Start" }
    eventNode --> htmlChangeEventNode["HTML-Change Event (1)"]


    %% Debounced Observer
    codeMirrorObserverDebounceNode["Debounce Observer Event (2)"]
    codeMirrorObserverDebounceNode --> htmlChangeEventNode
    codeMirrorObserverDebounceNode --> codeMirrorObserverNode["CodeMirror Observer (3b)"]

    %% Markdown Post-Processing
    htmlChangeEventNode --> markdownPostProcessNode["Markdown Post Process (3a)"]
    %% CodeMirror Extension Processing
    htmlChangeEventNode --> codeMirrorObserverDebounceNode

    %% CodeMirror Workflow
    codeMirrorObserverNode --> codeMirrorProcessImageLinksNode["Process Image Links (4a)"]
    codeMirrorProcessImageLinksNode --> codeMirrorProcessVideoLinksNode["Process Video Links (5a)"]
    codeMirrorProcessVideoLinksNode --> codeMirrorProcessAudioLinksNode["Process Audio Links (6a)"]
    codeMirrorProcessAudioLinksNode --> codeMirrorProcessDivEmbedLinksNode["Process Div Embed Links (7a)"]
    codeMirrorProcessDivEmbedLinksNode --> endOfProcessNode

    %% Markdown Workflow
    markdownPostProcessNode --> markdownPostProcessImageLinksNode["Process Image Links (4b)"]
    markdownPostProcessImageLinksNode --> markdownPostProcessVideoLinksNode["Process Video Links (5b)"]
    markdownPostProcessVideoLinksNode --> markdownPostProcessAudioLinksNode["Process Audio Links (6b)"]
    markdownPostProcessAudioLinksNode --> markdownPostProcessSpanEmbedLinksNode["Process Span Embed Links (7b)"]
    markdownPostProcessSpanEmbedLinksNode --> endOfProcessNode

    %% End
    endOfProcessNode["End of Process (8)"]
    endOfProcessNode --> endNode@{ shape: circle, label: "End" }
```

## Flow Description

1. **HTML-Change Event (1):**  
   The process starts with an HTML event. Depending on the active view in Obsidian, it triggers either the MarkdownPostProcessor (3a) or the CodeMirror Observer (3b). See [Editor Modes Explained](#editor-modes-explained) for details.

2. **Debounce Observer (2):**  
   Debounces frequent events triggered by opening, scrolling, or editing documents to reduce processing load.

3. **MarkdownPostProcessor (3a):**  
   Processes the entire page when a document opens or external changes occur. This method avoids repeated processing during scrolling but may cause initial load delays.

4. **CodeMirror Observer (3b):**  
   Processes HTML elements for S3 links in preview mode. Unlike MarkdownPostProcessor, it handles small document chunks incrementally, necessitating duplicate-state management to prevent re-downloading.

5. **Process Steps (4a–7b):**

    - **4a/4b:** Search for and process S3 image links.
    - **5a/5b:** Search for and process S3 video links.
    - **6a/6b:** Search for and process S3 audio links.
    - **7a:** CodeMirror-specific: Handles `div` tags for embedding files.
    - **7b:** MarkdownPostProcessor-specific: Handles `span` tags for embedding files.

6. **End (8):**  
   The process completes once all content is processed, the event is processed and the next one can be started.

## Editor Modes Explained

Obsidian operates in multiple editor modes:

### Editing vs. Reading Modes

-   **Editing:**  
    Includes both `Source Mode` and `Live Preview`.

    -   CodeMirror extension is invoked, but no elements are rendered, so no plugin processing occurs.

-   **Reading:**  
    In both modes, the MarkdownPostProcessor processes and resolves S3 links.

### Source Mode

-   Displays raw markdown for editing.
-   No S3 link processing in editing view.
-   Switching to reading view invokes the MarkdownPostProcessor to process content.

### Live Preview

-   Combines source and preview editing without switching views.
-   **Editing:**  
    CodeMirror extension handles content updates during scrolling or view changes.
-   **Reading:**  
    The MarkdownPostProcessor takes over to process content.
