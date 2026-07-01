import {
    normalizeVersionId,
    normalizeVaultName,
    normalizeObjectKey,
    normalizeBucketNameForFolder,
} from "../../../src/utils/normalizeUtils";

describe("normalizeVersionId", () => {
    test("removes leading non-alphanumeric characters", () => {
        expect(normalizeVersionId("!@#$version123")).toBe("version123");
        expect(normalizeVersionId("123version")).toBe("123version");
        expect(normalizeVersionId("")).toBe("");
    });

    test("keeps alphanumeric characters intact", () => {
        expect(normalizeVersionId("abc123")).toBe("abc123");
    });

    test("removes unsupported characters", () => {
        expect(normalizeVersionId("version@#$%123")).toBe("version123");
    });
});

describe("normalizeVaultName", () => {
    test("converts to lowercase", () => {
        expect(normalizeVaultName("MyVault")).toBe("myvault");
    });

    test("removes special characters", () => {
        expect(normalizeVaultName("Vault!@#")).toBe("vault");
        expect(normalizeVaultName("Test_Vault123")).toBe("test_vault123");
    });

    test("replaces spaces with underscores", () => {
        expect(normalizeVaultName("My Vault Name")).toBe("my_vault_name");
    });

    test("trims leading and trailing spaces", () => {
        expect(normalizeVaultName("  VaultName  ")).toBe("vaultname");
    });
});

describe("normalizeObjectKey", () => {
    test("converts to lowercase", () => {
        expect(normalizeObjectKey("MyObjectKey")).toBe("myobjectkey");
    });

    test("replaces spaces with underscores", () => {
        expect(normalizeObjectKey("My Object Key")).toBe("my_object_key");
    });

    test("removes unsupported characters", () => {
        expect(normalizeObjectKey("Key@#$%^&*()")).toBe("key");
        expect(normalizeObjectKey("Safe/Key-Object.name")).toBe(
            "safekey-object.name"
        );
    });

    test("preserves dots and hyphens", () => {
        expect(normalizeObjectKey("key.name-version")).toBe("key.name-version");
    });

    test("trims leading and trailing spaces", () => {
        expect(normalizeObjectKey("  Key Name  ")).toBe("key_name");
    });

    test("produces distinct keys for inputs differing only in dots vs underscores", () => {
        // Regression: previously dots/hyphens were collapsed to underscores,
        // causing cache collisions when an S3 object was renamed e.g. from
        // "this_is_a_test_01.02.2025" to "this_is_a_test_01_02_2025".
        const dotted = normalizeObjectKey("this_is_a_test_01.02.2025");
        const underscored = normalizeObjectKey("this_is_a_test_01_02_2025");

        expect(dotted).not.toBe(underscored);
    });

    test("produces distinct keys for inputs differing only in hyphens vs underscores", () => {
        const hyphenated = normalizeObjectKey("my-image-file");
        const underscored = normalizeObjectKey("my_image_file");

        expect(hyphenated).not.toBe(underscored);
    });

    test("preserves file extensions instead of collapsing the extension dot", () => {
        // Regression: previously "foo.png" normalized to "foo_png", colliding
        // with any object literally named "foo_png".
        expect(normalizeObjectKey("foo.png")).toBe("foo.png");
        expect(normalizeObjectKey("foo.png")).not.toBe(
            normalizeObjectKey("foo_png")
        );
    });
});

describe("normalizeBucketNameForFolder", () => {
    test("replaces periods with underscores", () => {
        expect(normalizeBucketNameForFolder("my.bucket.name")).toBe("my_bucket_name");
    });

    test("replaces hyphens with underscores", () => {
        expect(normalizeBucketNameForFolder("my-bucket-name")).toBe("my_bucket_name");
    });

    test("handles bucket names without special characters", () => {
        expect(normalizeBucketNameForFolder("mybucket123")).toBe("mybucket123");
    });

    test("handles mixed periods and hyphens", () => {
        expect(normalizeBucketNameForFolder("my.bucket-name.test")).toBe("my_bucket_name_test");
    });
});
