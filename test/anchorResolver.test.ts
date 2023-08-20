import AnchorResolver from "../src/resolver/anchorResolver";
import Config from "../src/config";

describe("AnchorResolver", () => {
    let resolver: AnchorResolver;

    beforeEach(() => {
        resolver = new AnchorResolver();
    });

    describe("resolveHtmlElement", () => {
        it("should return empty maps if no anchor tags are found", () => {
            const element = document.createElement("div");
            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should process anchor tags and classify them based on href", () => {
            const element = document.createElement("div");
            const anchor1 = document.createElement("a");
            anchor1.href = `${Config.S3_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;
            const anchor2 = document.createElement("a");
            anchor2.href = `${Config.S3_SIGNED_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;

            element.appendChild(anchor1);
            element.appendChild(anchor2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.signObjectKeys.size).toBe(1);
        });
    });

    describe("findAllObjectKeysInElement", () => {
        it("should return object keys based on data attributes", () => {
            const element = document.createElement("div");
            const anchor1 = document.createElement("a");
            anchor1.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey1"
            );
            const anchor2 = document.createElement("a");
            anchor2.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey2"
            );

            element.appendChild(anchor1);
            element.appendChild(anchor2);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).toEqual(["objectKey1", "objectKey2"]);
        });

        it("should ignore anchors without the data attribute", () => {
            const element = document.createElement("div");
            const anchor1 = document.createElement("a");
            anchor1.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey"
            );
            const anchor2 = document.createElement("a");

            element.appendChild(anchor1);
            element.appendChild(anchor2);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).toEqual(["objectKey"]);
        });

        it("should ignore anchors with invalid data attribute", () => {
            const element = document.createElement("div");
            const anchor1 = document.createElement("a");
            anchor1.setAttribute("invalid-data-attribute", "objectKey");

            element.appendChild(anchor1);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).not.toContain("objectKey");
        });
    });
});
