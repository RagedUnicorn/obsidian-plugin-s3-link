import { DownloadRecord } from "./downloadRecord";
import { DownloadState } from "./downloadState";
import Config from "../config";
import Cache from "../cache";

export default class DownloadManager {
    private static instance: DownloadManager;
    private readonly moduleName = "DownloadManager";
    private cache: Cache;

    private constructor() {
        this.cache = new Cache();
    }

    public static getInstance(): DownloadManager {
        if (!DownloadManager.instance) {
            DownloadManager.instance = new DownloadManager();
        }
        return DownloadManager.instance;
    }

    public addNewDownload(objectKey: string, versionId: string) {
        const downloadRecord: DownloadRecord = {
            objectKey: objectKey,
            versionId: versionId,
            startedAt: Date.now(),
            downloadState: DownloadState.PENDING,
        };

        this.writeDownloadRecord(objectKey, versionId, downloadRecord);
    }

    public setRunningState(objectKey: string, versionId: string) {
        const downloadRecord = this.getDownloadRecord(objectKey, versionId);

        downloadRecord.downloadState = DownloadState.RUNNING;
        this.writeDownloadRecord(objectKey, versionId, downloadRecord);
    }

    public setErrorState(objectKey: string, versionId: string) {
        const downloadRecord = this.getDownloadRecord(objectKey, versionId);

        downloadRecord.downloadState = DownloadState.FAILED;
        this.writeDownloadRecord(objectKey, versionId, downloadRecord);
        this.cache.removeItemFromCache(objectKey);
    }

    public setCompletedState(objectKey: string, versionId: string) {
        const downloadRecord = this.getDownloadRecord(objectKey, versionId);

        downloadRecord.downloadState = DownloadState.COMPLETED;
        this.writeDownloadRecord(objectKey, versionId, downloadRecord);
    }

    public cleanUnfinishedDownloads() {
        const localStorageItems = Object.keys(window.localStorage);

        localStorageItems.forEach((key) => {
            if (
                key.startsWith(
                    `${Config.PLUGIN_NAME}-${Config.MANAGER_PREFIX}/`
                )
            ) {
                const downloadRecord = JSON.parse(
                    window.localStorage.getItem(key) as string
                ) as DownloadRecord;

                if (downloadRecord.downloadState !== DownloadState.COMPLETED) {
                    console.log(
                        `${this.moduleName} - Cleaning unfinished download for ${downloadRecord.objectKey}`
                    );
                    this.cache.removeItemFromCache(downloadRecord.objectKey);
                    window.localStorage.removeItem(key);
                }
            }
        });
    }

    private writeDownloadRecord(
        objectKey: string,
        versionId: string,
        downloadRecord: DownloadRecord
    ) {
        window.localStorage.setItem(
            `${Config.PLUGIN_NAME}-${Config.MANAGER_PREFIX}/${objectKey}/${versionId}`,
            JSON.stringify(downloadRecord)
        );
    }

    private getDownloadRecord(objectKey: string, versionId: string) {
        const record = window.localStorage.getItem(
            `${Config.PLUGIN_NAME}-${Config.MANAGER_PREFIX}/${objectKey}/${versionId}`
        );

        if (!record) {
            throw new Error(
                `Download record not found for objectKey: ${objectKey}, versionId: ${versionId}`
            );
        }

        return JSON.parse(record) as DownloadRecord;
    }
}
