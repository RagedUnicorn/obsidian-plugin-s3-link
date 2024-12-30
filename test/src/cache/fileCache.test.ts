import FileCache from "../../../src/cache/fileCache";
import Config from "../../../src/config";

describe("FileCache", () => {
    let fileCache: FileCache;
    let mockApp: any;

    beforeEach(() => {
        mockApp = {
            vault: {
                adapter: {
                    exists: jest.fn(),
                },
                createFolder: jest.fn(),
                getResourcePath: jest.fn(),
                getAbstractFileByPath: jest.fn(),
            },
        };

        fileCache = new FileCache(mockApp);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("init", () => {
        it("should call isCacheFolderPresent and not create a folder if it exists", async () => {
            jest.spyOn(mockApp.vault.adapter, "exists").mockResolvedValue(true);

            console.info = jest.fn();

            await fileCache.init();

            expect(console.info).toHaveBeenCalledWith(
                "FileCache::init - Cache folder already exists"
            );
            expect(mockApp.vault.createFolder).not.toHaveBeenCalled();
        });

        it("should create the cache folder if it does not exist", async () => {
            jest.spyOn(mockApp.vault.adapter, "exists").mockResolvedValue(
                false
            );

            await fileCache.init();

            expect(mockApp.vault.createFolder).toHaveBeenCalledWith(
                Config.S3_FILE_LINK_CACHE_FOLDER
            );
        });
    });

    describe("fileExistsInCacheFolder", () => {
        it("should return true if the file exists", async () => {
            mockApp.vault.adapter.exists.mockResolvedValue(true);

            const result = await fileCache.fileExistsInCacheFolder(
                "test.txt",
                "1234"
            );

            expect(result).toBe(true);
            expect(mockApp.vault.adapter.exists).toHaveBeenCalledWith(
                expect.any(String)
            );
        });

        it("should return false if the file does not exist", async () => {
            mockApp.vault.adapter.exists.mockResolvedValue(false);

            const result = await fileCache.fileExistsInCacheFolder(
                "test.txt",
                "1234"
            );

            expect(result).toBe(false);
        });
    });

    describe("closeAllOpenStreams", () => {
        it("should close all open streams", () => {
            const mockStream = {
                destroy: jest.fn(),
                destroyed: false,
            };

            fileCache["openStreams"] = [mockStream as any];

            fileCache.closeAllOpenStreams();

            expect(mockStream.destroy).toHaveBeenCalled();
        });

        it("should skip already destroyed streams", () => {
            const mockStream = {
                destroy: jest.fn(),
                destroyed: true,
            };

            fileCache["openStreams"] = [mockStream as any];

            fileCache.closeAllOpenStreams();

            expect(mockStream.destroy).not.toHaveBeenCalled();
        });
    });
});
