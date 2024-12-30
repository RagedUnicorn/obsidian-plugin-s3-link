import ImageResolver from "../../src/resolver/imageResolver";
import Config from "../../src/config";

describe("ImageResolver", () => {
    let resolver: ImageResolver;

    beforeEach(() => {
        resolver = new ImageResolver();
    });

    describe("resolveHtmlElement", () => {
        it("should return empty maps if no image tags are found", () => {
            const element = document.createElement("div");
            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should process image tags and classify them based on src", () => {
            const element = document.createElement("div");
            const img1 = document.createElement("img");
            const img2 = document.createElement("img");

            img1.src = `${Config.S3_FILE_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;
            img2.src = `${Config.S3_SIGNED_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;

            element.appendChild(img1);
            element.appendChild(img2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.signObjectKeys.size).toBe(1);
        });

        it("should ignore image tags that do not contain an S3 object link", () => {
            const element = document.createElement("div");
            const img1 = document.createElement("img");
            const img2 = document.createElement("img");

            img1.src = "https://www.example.com/image.jpg";
            img2.src = "https://www.example.com/image.png";

            element.appendChild(img1);
            element.appendChild(img2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });
    });
});
