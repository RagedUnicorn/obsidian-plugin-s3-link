import FileCache from "../../../src/cache/fileCache";
import Config from "../../../src/config";
import { WriteStream } from "fs";
import { App, Vault, DataAdapter } from "obsidian";

function createMockAdapter(): DataAdapter {
    return {
        getName: jest.fn(() => "mockAdapter"),
        exists: jest.fn(),
        stat: jest.fn(),
        list: jest.fn(),
        read: jest.fn(),
        readBinary: jest.fn(),
        write: jest.fn(),
        writeBinary: jest.fn(),
        append: jest.fn(),
        process: jest.fn(),
        getResourcePath: jest.fn(),
        mkdir: jest.fn(),
        trashSystem: jest.fn(),
        trashLocal: jest.fn(),
        rmdir: jest.fn(),
        remove: jest.fn(),
        rename: jest.fn(),
        copy: jest.fn(),
    };
}

function createMockVault(adapter: DataAdapter): Partial<Vault> {
    return {
        adapter: adapter,
        createFolder: jest.fn(),
        getResourcePath: jest.fn(),
        getAbstractFileByPath: jest.fn(),
        getName: jest.fn(() => "MockVault"),
    };
}

describe("FileCache", () => {
    let fileCache: FileCache;
    let mockApp: Partial<App>;

    beforeEach(() => {
        const mockAdapter = createMockAdapter(); // Create adapter mock
        const mockVault = createMockVault(mockAdapter); // Create vault mock

        mockApp = { vault: mockVault } as Partial<App>; // Mock App
        fileCache = new FileCache(mockApp as App);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("init", () => {
        it("should not create folder if cache exists", async () => {
            if (!mockApp.vault || !mockApp.vault.adapter) {
                throw new Error("Vault or adapter is undefined");
            }

            jest.spyOn(mockApp.vault.adapter, "exists").mockResolvedValue(true); // Mock adapter method
            console.info = jest.fn(); // Mock console

            await fileCache.init();

            expect(console.info).toHaveBeenCalledWith(
                "FileCache::init - Cache folder already exists"
            );
            expect(mockApp.vault.createFolder).not.toHaveBeenCalled();
        });

        it("should create folder if cache does not exist", async () => {
            if (!mockApp.vault || !mockApp.vault.adapter) {
                throw new Error("Vault or adapter is undefined");
            }

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
        it("should return true if file exists", async () => {
            if (!mockApp.vault || !mockApp.vault.adapter) {
                throw new Error("Vault or adapter is undefined");
            }

            jest.spyOn(mockApp.vault.adapter, "exists").mockResolvedValue(true);

            const result = await fileCache.fileExistsInCacheFolder(
                "test.txt",
                "1234"
            );

            expect(result).toBe(true);
            expect(mockApp.vault.adapter.exists).toHaveBeenCalledWith(
                expect.any(String)
            );
        });

        it("should return false if file does not exist", async () => {
            if (!mockApp.vault || !mockApp.vault.adapter) {
                throw new Error("Vault or adapter is undefined");
            }

            jest.spyOn(mockApp.vault.adapter, "exists").mockResolvedValue(
                false
            );

            const result = await fileCache.fileExistsInCacheFolder(
                "test.txt",
                "1234"
            );

            expect(result).toBe(false);
        });
    });

    describe("closeAllOpenStreams", () => {
        it("should close all open streams", () => {
            const mockStream: Partial<WriteStream> = {
                destroy: jest.fn(),
                destroyed: false,
                close: jest.fn(),
                path: "mockPath",
            };

            fileCache["openStreams"] = [mockStream as WriteStream];
            fileCache.closeAllOpenStreams();

            expect(mockStream.destroy).toHaveBeenCalled();
        });

        it("should skip already destroyed streams", () => {
            const mockStream: Partial<WriteStream> = {
                destroy: jest.fn(),
                destroyed: true,
                close: jest.fn(),
                path: "mockPath",
            };

            fileCache["openStreams"] = [mockStream as WriteStream];
            fileCache.closeAllOpenStreams();

            expect(mockStream.destroy).not.toHaveBeenCalled();
        });
    });
});
