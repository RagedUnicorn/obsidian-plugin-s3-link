import SpanEmbedResolver from "../../../src/resolvers/spanEmbedResolver";
import Config from "../../../src/config/config";

describe("SpanEmbedResolver", () => {
    let resolver: SpanEmbedResolver;

    beforeEach(() => {
        resolver = new SpanEmbedResolver();
    });

    describe("resolveHtmlElement", () => {
        it("should return empty maps if no span embed tags are found", () => {
            const element = document.createElement("div");
            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should process span embed tags and classify them based on src", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("span");
            const video2 = document.createElement("span");

            video1.setAttribute("class", "internal-embed");
            video2.setAttribute("class", "internal-embed");
            video1.setAttribute(
                "src",
                `${Config.S3_FILE_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`
            );
            video2.setAttribute(
                "src",
                `${Config.S3_SIGNED_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`
            );

            element.appendChild(video1);
            element.appendChild(video2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.signObjectKeys.size).toBe(1);
        });

        it("should ignore span embed tags that do not contain an S3 object link", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("span");
            const video2 = document.createElement("span");

            video1.setAttribute("class", "internal-embed");
            video2.setAttribute("class", "internal-embed");
            video1.setAttribute("src", "https://www.example.com/somefile.jpg");
            video2.setAttribute("src", "https://www.example.com/somefile.png");

            element.appendChild(video1);
            element.appendChild(video2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });
    });
});
