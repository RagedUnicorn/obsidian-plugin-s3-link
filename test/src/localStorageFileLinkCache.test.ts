import LocalStorageFileLinkCache from "../../src/cache/localStorageFileLinkCache";
import Config from "../../src/config";
import { localStorageMock } from "./mock/localStorageMock";
import { createS3FileLink } from "../../src/model/s3FileLink";

describe("LocalStorageFileLinkCache", () => {
    let localStorageFileLinkCache: LocalStorageFileLinkCache;
    const vaultName = "testVault";
    let originalSetItem: (key: string, value: string) => void;
    let originalRemoveItem: (key: string) => void;

    beforeEach(() => {
        // update window object with mocked local storage
        Object.defineProperty(global.window, "localStorage", {
            value: localStorageMock,
            writable: true,
        });

        // store the original setItem function
        originalSetItem = window.localStorage.setItem;
        // store the original removeItem function
        originalRemoveItem = window.localStorage.removeItem;

        localStorageFileLinkCache = new LocalStorageFileLinkCache(vaultName);
    });

    describe("cacheFileLink", () => {
        it("should write an entry to localStorage for the given objectKey and versionId", () => {
            const mockObjectKey = "testKey!$";
            const normalizedObjectKey = "testkey";
            const mockVersionId = "12345";
            const expectedKey = `${Config.PLUGIN_NAME}/${vaultName}/${Config.S3_FILE_LINKS_CACHE_PATH}/${normalizedObjectKey}`;

            const s3FileLink = createS3FileLink(mockObjectKey, mockVersionId);

            window.localStorage.setItem = jest.fn();
            localStorageFileLinkCache.cacheFileLink(s3FileLink);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                expectedKey,
                expect.any(String)
            );

            const mockSetItemCall = (window.localStorage.setItem as jest.Mock)
                .mock.calls[0];

            const storedKey = mockSetItemCall[0];
            expect(storedKey).toBe(expectedKey);

            const storedValue = JSON.parse(mockSetItemCall[1]);

            expect(storedValue.objectKey).toEqual(mockObjectKey);
            expect(storedValue.versionId).toEqual(mockVersionId);
            expect(storedValue.lastUpdate).toBeDefined();
        });
    });
});
