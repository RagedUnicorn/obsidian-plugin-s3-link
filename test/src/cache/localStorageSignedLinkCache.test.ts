import LocalStorageSignedLinkCache from "../../../src/cache/localStorageSignedLinkCache";
import Config from "../../../src/config/config";
import { localStorageMock } from "../mocks/localStorageMock";
import { createS3SignedLink } from "../../../src/core/s3SignedLink";

describe("LocalStorageSignedLinkCache", () => {
    let localStorageSignedLinkCache: LocalStorageSignedLinkCache;
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

        localStorageSignedLinkCache = new LocalStorageSignedLinkCache(
            vaultName
        );
    });

    afterEach(() => {
        window.localStorage.setItem = originalSetItem;
        window.localStorage.removeItem = originalRemoveItem;
    });

    describe("cacheSignedLink", () => {
        it("should write an entry to localStorage for the given objectKey", () => {
            const mockObjectKey = "testKey!$";
            const normalizedObjectKey = "testkey";
            const mockSignedUrl = "https://example.com/signed-link";
            const expectedKey = `${Config.PLUGIN_NAME}/${vaultName}/${Config.S3_SIGNED_LINKS_CACHE_PATH}/${normalizedObjectKey}`;

            const signedLink = createS3SignedLink(mockObjectKey, mockSignedUrl);

            window.localStorage.setItem = jest.fn();
            localStorageSignedLinkCache.cacheSignedLink(signedLink);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                expectedKey,
                expect.any(String)
            );
            console.log(JSON.stringify(localStorage, null, 2));

            const mockSetItemCall = (window.localStorage.setItem as jest.Mock)
                .mock.calls[0];

            const storedKey = mockSetItemCall[0];
            expect(storedKey).toBe(expectedKey);

            const storedValue = JSON.parse(mockSetItemCall[1]);

            expect(storedValue.objectKey).toEqual(mockObjectKey);
            expect(storedValue.signedUrl).toEqual(mockSignedUrl);
            expect(storedValue.lastUpdate).toBeDefined();
        });
    });

    describe("findCachedSignedLink", () => {
        it("should retrieve a cached signed link for a given objectKey", () => {
            const mockObjectKey = "testKey!$";
            const mockSignedUrl = "https://example.com/signed-link";

            const signedLink = createS3SignedLink(mockObjectKey, mockSignedUrl);
            localStorageSignedLinkCache.cacheSignedLink(signedLink);
            console.log(JSON.stringify(localStorage, null, 2));
            const cachedLink =
                localStorageSignedLinkCache.findCachedSignedLink(mockObjectKey);

            expect(cachedLink).not.toBeNull();
            expect(cachedLink?.objectKey).toEqual(mockObjectKey);
            expect(cachedLink?.signedUrl).toEqual(mockSignedUrl);
        });

        it("should return null if no cached signed link is found", () => {
            const cachedLink =
                localStorageSignedLinkCache.findCachedSignedLink(
                    "nonExistentKey"
                );

            expect(cachedLink).toBeNull();
        });
    });

    describe("isS3SignedLinkCacheItemExpired", () => {
        it("should return true if the cache item is expired", () => {
            const expiredTimestamp =
                Date.now() -
                (Config.S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS + 1) * 1000;

            const isExpired =
                localStorageSignedLinkCache.isS3SignedLinkCacheItemExpired(
                    expiredTimestamp
                );

            expect(isExpired).toBe(true);
        });

        it("should return false if the cache item is not expired", () => {
            const validTimestamp =
                Date.now() -
                (Config.S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS - 1) * 1000;

            const isExpired =
                localStorageSignedLinkCache.isS3SignedLinkCacheItemExpired(
                    validTimestamp
                );

            expect(isExpired).toBe(false);
        });
    });

    describe("clearSignedLinkCache", () => {
        it("should clear the entire signed link cache", () => {
            const mockObjectKey1 = "testKey!$1";
            const normalizedObjectKey1 = "testkey1";
            const mockSignedUrl1 = "https://example.com/signed-link";

            const signedLink1 = createS3SignedLink(
                mockObjectKey1,
                mockSignedUrl1
            );
            localStorageSignedLinkCache.cacheSignedLink(signedLink1);

            const mockObjectKey2 = "testKey!$2";
            const normalizedObjectKey2 = "testkey2";
            const mockSignedUrl2 = "https://example.com/signed-link2";

            const signedLink2 = createS3SignedLink(
                mockObjectKey2,
                mockSignedUrl2
            );
            localStorageSignedLinkCache.cacheSignedLink(signedLink2);

            const expectedCachedLink1 =
                localStorageSignedLinkCache.findCachedSignedLink(
                    normalizedObjectKey1
                );

            expect(expectedCachedLink1).not.toBeNull();

            const expectedCachedLink2 =
                localStorageSignedLinkCache.findCachedSignedLink(
                    normalizedObjectKey2
                );

            expect(expectedCachedLink2).not.toBeNull();

            // clear the cache
            localStorageSignedLinkCache.clearSignedLinkCache();

            const deletedCachedLink1 =
                localStorageSignedLinkCache.findCachedSignedLink(
                    normalizedObjectKey1
                );
            const deletedCachedLink2 =
                localStorageSignedLinkCache.findCachedSignedLink(
                    normalizedObjectKey2
                );

            expect(deletedCachedLink1).toBeNull();
            expect(deletedCachedLink2).toBeNull();
        });
    });
});
