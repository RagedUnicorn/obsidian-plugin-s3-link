import SpanResolver from "../src/resolver/spanResolver";
import Config from "../src/config";

describe("SpanResolver", () => {
    let resolver: SpanResolver;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        resolver = new SpanResolver();
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {}); // Suppress the warning
    });

    afterEach(() => {
        warnSpy.mockRestore(); // Restore the original implementation after each test
    });

    describe("resolveHtmlElement", () => {
        it("should return empty maps if no span tags with src are found", () => {
            const element = document.createElement("div");
            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should process span tags and classify them based on src", () => {
            const element = document.createElement("div");
            const span1 = document.createElement("span");
            span1.setAttribute(
                "src",
                `${Config.S3_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`
            );

            element.appendChild(span1);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should not process span tags with signed links as src", () => {
            const element = document.createElement("div");
            const span1 = document.createElement("span");
            span1.setAttribute(
                "src",
                `${Config.S3_SIGNED_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`
            );

            element.appendChild(span1);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);

            expect(console.warn).toHaveBeenCalled();
        });
    });

    describe("findAllObjectKeysInElement", () => {
        it("should return object keys based on data attributes", () => {
            const element = document.createElement("div");
            const span1 = document.createElement("span");
            span1.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey1"
            );
            const span2 = document.createElement("span");
            span2.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey2"
            );

            element.appendChild(span1);
            element.appendChild(span2);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).toEqual(["objectKey1", "objectKey2"]);
        });

        it("should ignore spans without the data attribute", () => {
            const element = document.createElement("div");
            const span1 = document.createElement("span");
            span1.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey"
            );
            const span2 = document.createElement("span");

            element.appendChild(span1);
            element.appendChild(span2);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).toEqual(["objectKey"]);
        });

        it("should ignore spans with invalid data attribute", () => {
            const element = document.createElement("div");
            const span1 = document.createElement("span");
            span1.setAttribute("invalid-data-attribute", "objectKey");

            element.appendChild(span1);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).not.toContain("objectKey");
        });
    });
});
