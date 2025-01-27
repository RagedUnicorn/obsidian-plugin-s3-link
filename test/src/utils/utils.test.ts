import {
    removeS3LinkPrefixFromSourceUrl,
    getS3LinkPrefixFromSourceUrl,
    findAllObjectKeysInText,
} from "../../../src/utils/utils";

describe("Utility Functions", () => {
    describe("removeS3LinkPrefixFromSourceUrl", () => {
        it("should remove the s3 prefix from a source URL", () => {
            expect(removeS3LinkPrefixFromSourceUrl("s3:bucket/key")).toBe(
                "bucket/key"
            );
            expect(removeS3LinkPrefixFromSourceUrl("s3-sign:bucket/key")).toBe(
                "bucket/key"
            );
        });
    });

    describe("getS3LinkPrefixFromSourceUrl", () => {
        it("should get the s3 prefix from a source URL", () => {
            expect(getS3LinkPrefixFromSourceUrl("s3:bucket/key")).toBe("s3");
            expect(getS3LinkPrefixFromSourceUrl("s3-sign:bucket/key")).toBe(
                "s3-sign"
            );
        });
    });

    describe("findAllObjectKeysInText", () => {
        it("should find all s3 object keys in the text", () => {
            const content = `
                Here are some links:
                s3:bucket/key1
                s3-sign:bucket/key2
                s3:another-bucket/key3
            `;
            expect(findAllObjectKeysInText(content)).toEqual([
                "s3:bucket/key1",
                "s3-sign:bucket/key2",
                "s3:another-bucket/key3",
            ]);
        });

        it("should return an empty array if no matches are found", () => {
            const content = "No links here!";
            expect(findAllObjectKeysInText(content)).toEqual([]);
        });

        it("should handle empty input gracefully", () => {
            expect(findAllObjectKeysInText("")).toEqual([]);
        });

        it("should match keys with special characters", () => {
            const content = `
                s3:bucket/key_with.special-characters
                s3-sign:bucket/key.with-dots
            `;
            expect(findAllObjectKeysInText(content)).toEqual([
                "s3:bucket/key_with.special-characters",
                "s3-sign:bucket/key.with-dots",
            ]);
        });
    });
});
