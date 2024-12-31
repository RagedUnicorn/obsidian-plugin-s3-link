import DivEmbedResolver from "../../../src/resolvers/divEmbedResolver";
import Config from "../../../src/config/config";

describe("DivEmbedResolver", () => {
    let resolver: DivEmbedResolver;

    beforeEach(() => {
        resolver = new DivEmbedResolver();
    });

    describe("resolveHtmlElement", () => {
        it("should return empty maps if no div embed tags are found", () => {
            const element = document.createElement("div");
            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should process div embed tags and classify them based on src", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("div");
            const video2 = document.createElement("div");

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

        it("should ignore div embed tags that do not contain an S3 object link", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("div");
            const video2 = document.createElement("div");

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
