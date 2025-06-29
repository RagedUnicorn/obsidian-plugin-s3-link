import FileCache from "../../../src/cache/fileCache";
import Config from "../../../src/config/config";
import { WriteStream } from "fs";
import { App, Vault, DataAdapter } from "obsidian";
import PluginStateManager from "../../../src/core/pluginStateManager";
import { PluginSettings } from "../../../src/settings/pluginSettings";

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
    let mockPluginStateManager: PluginStateManager;

    beforeEach(() => {
        const mockAdapter = createMockAdapter(); // Create adapter mock
        const mockVault = createMockVault(mockAdapter); // Create vault mock

        mockApp = { vault: mockVault } as Partial<App>; // Mock App

        // Mock PluginStateManager
        mockPluginStateManager = {
            getSettings: jest.fn(
                () =>
                    ({
                        bucketName: "test-bucket.name",
                        region: "us-east-1",
                        accessKeyId: "",
                        secretAccessKey: "",
                        profile: "None",
                    } as PluginSettings)
            ),
        } as unknown as PluginStateManager;

        fileCache = new FileCache(mockApp as App, mockPluginStateManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("init", () => {
        it("should create bucket folder when cache folder exists", async () => {
            if (!mockApp.vault || !mockApp.vault.adapter) {
                throw new Error("Vault or adapter is undefined");
            }

            // First call returns true (cache folder exists), second returns false (bucket folder doesn't exist)
            jest.spyOn(mockApp.vault.adapter, "exists")
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);
            console.info = jest.fn();

            await fileCache.init();

            expect(mockApp.vault.createFolder).toHaveBeenCalledWith(
                "s3_link_cache/test_bucket_name"
            );
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
