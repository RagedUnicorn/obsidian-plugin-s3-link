import VideoResolver from "../src/resolver/videoResolver";
import Config from "../src/config";

describe("VideoResolver", () => {
    let resolver: VideoResolver;

    beforeEach(() => {
        resolver = new VideoResolver();
    });

    describe("resolveHtmlElement", () => {
        it("should return empty maps if no video tags are found", () => {
            const element = document.createElement("div");
            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should process video tags and classify them based on src", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("video");
            video1.src = `${Config.S3_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;
            const video2 = document.createElement("video");
            video2.src = `${Config.S3_SIGNED_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;

            element.appendChild(video1);
            element.appendChild(video2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.signObjectKeys.size).toBe(1);
        });
    });

    describe("findAllObjectKeysInElement", () => {
        it("should return object keys based on data attributes", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("video");
            video1.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey1"
            );
            const video2 = document.createElement("video");
            video2.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey2"
            );

            element.appendChild(video1);
            element.appendChild(video2);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).toEqual(["objectKey1", "objectKey2"]);
        });

        it("should ignore videos without the data attribute", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("video");
            video1.setAttribute(
                Config.S3_LINK_PLUGIN_DATA_ATTRIBUTE,
                "objectKey"
            );
            const video2 = document.createElement("video");

            element.appendChild(video1);
            element.appendChild(video2);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).toEqual(["objectKey"]);
        });

        it("it should ignore videos with invalid data attribute", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("video");
            video1.setAttribute("invalid-data-attribute", "objectKey");

            element.appendChild(video1);

            const result = resolver.findAllObjectKeysInElement(element);
            expect(result).not.toContain("objectKey");
        });
    });
});
