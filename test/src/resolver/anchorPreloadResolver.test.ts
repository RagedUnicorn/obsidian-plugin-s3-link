import AnchorPreloadResolver from "../../../src/resolvers/anchorPreloadResolver";

describe("AnchorPreloadResolver", () => {
    let anchorPreloadResolver: AnchorPreloadResolver;

    beforeEach(() => {
        anchorPreloadResolver = new AnchorPreloadResolver();
    });

    describe("resolveHtmlElement", () => {
        it("should resolve S3 file links for preloading", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <a href="s3:test-folder/test-file.pdf">Download PDF</a>
            `;

            const result = anchorPreloadResolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.objectKeys.has("test-folder/test-file.pdf")).toBe(true);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should not preload S3 signed links", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <a href="s3-sign:test-folder/test-file.pdf">View PDF</a>
            `;

            const result = anchorPreloadResolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });


        it("should handle multiple S3 file links", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <a href="s3:file1.pdf">File 1</a>
                <a href="s3:file2.pdf">File 2</a>
                <a href="https://example.com">External</a>
                <a href="s3-sign:file3.pdf">Signed File</a>
            `;

            const result = anchorPreloadResolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(2);
            expect(result.objectKeys.has("file1.pdf")).toBe(true);
            expect(result.objectKeys.has("file2.pdf")).toBe(true);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should handle object keys with colons", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <a href="s3:folder/file:with:colons.pdf">Download</a>
            `;

            const result = anchorPreloadResolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.objectKeys.has("folder/file:with:colons.pdf")).toBe(true);
        });

        it("should ignore non-S3 links", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <a href="https://example.com">External</a>
                <a href="/local/path">Local</a>
                <a href="obsidian://open">Obsidian</a>
            `;

            const result = anchorPreloadResolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });
    });

    describe("resolveTextContent", () => {
        it("should resolve S3 file links from markdown links", () => {
            const text = "See [Download PDF](s3:test-folder/test-file.pdf) here.";

            const result = anchorPreloadResolver.resolveTextContent(text);

            expect(result.objectKeys.size).toBe(1);
            expect(result.objectKeys.has("test-folder/test-file.pdf")).toBe(
                true
            );
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should resolve raw S3 file links", () => {
            const text = "Preload this s3:folder/raw-file.pdf now.";

            const result = anchorPreloadResolver.resolveTextContent(text);

            expect(result.objectKeys.size).toBe(1);
            expect(result.objectKeys.has("folder/raw-file.pdf")).toBe(true);
        });

        it("should not preload S3 signed links", () => {
            const text =
                "Signed [View PDF](s3-sign:test-folder/test-file.pdf) link.";

            const result = anchorPreloadResolver.resolveTextContent(text);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should handle multiple links and ignore external/signed ones", () => {
            const text = `
                [File 1](s3:file1.pdf)
                [File 2](s3:file2.pdf)
                [External](https://example.com)
                [Signed](s3-sign:file3.pdf)
            `;

            const result = anchorPreloadResolver.resolveTextContent(text);

            expect(result.objectKeys.size).toBe(2);
            expect(result.objectKeys.has("file1.pdf")).toBe(true);
            expect(result.objectKeys.has("file2.pdf")).toBe(true);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should deduplicate repeated object keys", () => {
            const text = `
                [First](s3:same/file.pdf)
                [Second](s3:same/file.pdf)
            `;

            const result = anchorPreloadResolver.resolveTextContent(text);

            expect(result.objectKeys.size).toBe(1);
            expect(result.objectKeys.has("same/file.pdf")).toBe(true);
        });

        it("should ignore S3 prefixes (keys ending with a slash)", () => {
            const text = "[Folder](s3:some-folder/)";

            const result = anchorPreloadResolver.resolveTextContent(text);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should ignore text without any S3 links", () => {
            const text = "Just some plain text with a [link](https://x.io).";

            const result = anchorPreloadResolver.resolveTextContent(text);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });
    });
});