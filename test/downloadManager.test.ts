import DownloadManager from "../src/network/downloadManager";
import { DownloadState } from "../src/network/downloadState";
import { localStorageMock } from "./mock/localStorageMock";
import Config from "../src/config";

describe("DownloadManager", () => {
    beforeEach(() => {
        // update window object with mocked local storage
        Object.defineProperty(global.window, "localStorage", {
            value: localStorageMock,
            writable: true,
        });
    });

    afterEach(() => {
        // clear the localStorage between tests
        window.localStorage.clear();
        jest.clearAllMocks();
    });

    it("should create a single instance", () => {
        const instance1 = DownloadManager.getInstance();
        const instance2 = DownloadManager.getInstance();

        expect(instance1).toBe(instance2);
    });

    it("should add a new download record", () => {
        const downloadManager = DownloadManager.getInstance();
        downloadManager.addNewDownload("testObject", "testVersion");
        const record = JSON.parse(
            window.localStorage.getItem(
                `${Config.PLUGIN_NAME}-${Config.MANAGER_PREFIX}/testObject/testVersion`
            ) as string
        );

        expect(record.downloadState).toBe(DownloadState.PENDING);
    });

    it("should update a download record to RUNNING state", () => {
        const downloadManager = DownloadManager.getInstance();
        downloadManager.addNewDownload("testObject", "testVersion");
        downloadManager.setRunningState("testObject", "testVersion");
        const record = JSON.parse(
            window.localStorage.getItem(
                `${Config.PLUGIN_NAME}-${Config.MANAGER_PREFIX}/testObject/testVersion`
            ) as string
        );

        expect(record.downloadState).toBe(DownloadState.RUNNING);
    });

    it("should update a download record to FAILED state and remove from cache", () => {
        const downloadManager = DownloadManager.getInstance();
        downloadManager.addNewDownload("testObject", "testVersion");
        downloadManager.setErrorState("testObject", "testVersion");

        const record = JSON.parse(
            window.localStorage.getItem(
                `${Config.PLUGIN_NAME}-${Config.MANAGER_PREFIX}/testObject/testVersion`
            ) as string
        );

        expect(record.downloadState).toBe(DownloadState.FAILED);
    });

    it("should update a download record to COMPLETED state", () => {
        const downloadManager = DownloadManager.getInstance();
        downloadManager.addNewDownload("testObject", "testVersion");
        downloadManager.setCompletedState("testObject", "testVersion");

        const record = JSON.parse(
            window.localStorage.getItem(
                `${Config.PLUGIN_NAME}-${Config.MANAGER_PREFIX}/testObject/testVersion`
            ) as string
        );

        expect(record.downloadState).toBe(DownloadState.COMPLETED);
    });
});
