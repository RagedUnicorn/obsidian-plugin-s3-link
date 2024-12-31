import AudioResolver from "../../../src/resolvers/audioResolver";
import Config from "../../../src/config/config";

describe("AudioResolver", () => {
    let resolver: AudioResolver;

    beforeEach(() => {
        resolver = new AudioResolver();
    });

    describe("resolveHtmlElement", () => {
        it("should return empty maps if no video tags are found", () => {
            const element = document.createElement("div");
            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });

        it("should process audio tags and classify them based on src", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("audio");
            const video2 = document.createElement("audio");

            video1.src = `${Config.S3_FILE_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;
            video2.src = `${Config.S3_SIGNED_LINK_PREFIX}${Config.S3_LINK_SPLITTER}objectKey`;

            element.appendChild(video1);
            element.appendChild(video2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(1);
            expect(result.signObjectKeys.size).toBe(1);
        });

        it("should ignore audio tags that do not contain an S3 object link", () => {
            const element = document.createElement("div");
            const video1 = document.createElement("audio");
            const video2 = document.createElement("audio");

            video1.src = "https://www.example.com/audio.mp3";
            video2.src = "https://www.example.com/audio.mp4";

            element.appendChild(video1);
            element.appendChild(video2);

            const result = resolver.resolveHtmlElement(element);

            expect(result.objectKeys.size).toBe(0);
            expect(result.signObjectKeys.size).toBe(0);
        });
    });
});
