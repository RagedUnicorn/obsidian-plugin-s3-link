import {
    normalizeVersionId,
    normalizeVaultName,
    normalizeObjectKey,
} from "../../src/util/util";

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
            "safekey_object_name"
        );
    });

    test("replaces dots and hyphens with underscores", () => {
        expect(normalizeObjectKey("key.name-version")).toBe("key_name_version");
    });

    test("trims leading and trailing spaces", () => {
        expect(normalizeObjectKey("  Key Name  ")).toBe("key_name");
    });
});
