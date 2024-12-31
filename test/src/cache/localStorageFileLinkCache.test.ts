import LocalStorageFileLinkCache from "../../../src/cache/localStorageFileLinkCache";
import Config from "../../../src/config/config";
import { localStorageMock } from "../mocks/localStorageMock";
import { createS3FileLink } from "../../../src/core/s3FileLink";

describe("LocalStorageFileLinkCache", () => {
    let localStorageFileLinkCache: LocalStorageFileLinkCache;
    const vaultName = "testVault";
    let originalSetItem: (key: string, value: string) => void;
    let originalRemoveItem: (key: string) => void;

    beforeEach(() => {
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

    afterEach(() => {
        window.localStorage.setItem = originalSetItem;
        window.localStorage.removeItem = originalRemoveItem;
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

    describe("findCachedFileLink", () => {
        it("should retrieve a cached file link for a given objectKey", () => {
            const mockObjectKey = "testKey!$";
            const mockVersionId = "12345";

            const fileLink = createS3FileLink(mockObjectKey, mockVersionId);
            localStorageFileLinkCache.cacheFileLink(fileLink);

            const cachedLink =
                localStorageFileLinkCache.findCachedFileLink(mockObjectKey);

            expect(cachedLink).not.toBeNull();
            expect(cachedLink?.objectKey).toEqual(mockObjectKey);
            expect(cachedLink?.versionId).toEqual(mockVersionId);
        });

        it("should return null if no cached file link is found", () => {
            const cachedLink =
                localStorageFileLinkCache.findCachedFileLink("nonExistentKey");

            expect(cachedLink).toBeNull();
        });
    });

    describe("isS3FileLinkTTLExpired", () => {
        it("should return true if the cache item is expired", () => {
            const expiredTimestamp =
                Date.now() -
                (Config.S3_FILE_LINK_EXPIRATION_TIME_SECONDS + 1) * 1000;

            const isExpired =
                localStorageFileLinkCache.isS3FileLinkTTLExpired(
                    expiredTimestamp
                );

            expect(isExpired).toBe(true);
        });

        it("should return false if the cache item is not expired", () => {
            const validTimestamp =
                Date.now() -
                (Config.S3_FILE_LINK_EXPIRATION_TIME_SECONDS - 1) * 1000;

            const isExpired =
                localStorageFileLinkCache.isS3FileLinkTTLExpired(
                    validTimestamp
                );

            expect(isExpired).toBe(false);
        });
    });

    describe("clearFileLinkCache", () => {
        it("should clear the entire file link cache", () => {
            const mockObjectKey1 = "testKey!$1";
            const mockVersionId1 = "12345";
            const fileLink1 = createS3FileLink(mockObjectKey1, mockVersionId1);
            localStorageFileLinkCache.cacheFileLink(fileLink1);

            const mockObjectKey2 = "testKey!$2";
            const mockVersionId2 = "67890";
            const fileLink2 = createS3FileLink(mockObjectKey2, mockVersionId2);
            localStorageFileLinkCache.cacheFileLink(fileLink2);

            const cachedLink1 =
                localStorageFileLinkCache.findCachedFileLink(mockObjectKey1);
            const cachedLink2 =
                localStorageFileLinkCache.findCachedFileLink(mockObjectKey2);

            expect(cachedLink1).not.toBeNull();
            expect(cachedLink2).not.toBeNull();

            localStorageFileLinkCache.clearFileLinkCache();

            const deletedCachedLink1 =
                localStorageFileLinkCache.findCachedFileLink(mockObjectKey1);
            const deletedCachedLink2 =
                localStorageFileLinkCache.findCachedFileLink(mockObjectKey2);

            expect(deletedCachedLink1).toBeNull();
            expect(deletedCachedLink2).toBeNull();
        });
    });
});
