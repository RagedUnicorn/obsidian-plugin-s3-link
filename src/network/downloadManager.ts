import { Readable } from "stream";

import AwsS3Client from "./awsS3Client";
import LocalStorageFileLinkCache from "../cache/localStorageFileLinkCache";
import FileCache from "../cache/fileCache";

import DownloadRecord from "./downloadRecord";
import S3FileLink, { createS3FileLink } from "../core/s3FileLink";

import { emitter, EVENT_DOWNLOAD_FINISHED } from "../event/event";

export default class DownloadManager {
    private readonly moduleName = "DownloadManager";
    private downloadRecords: Map<string, DownloadRecord> = new Map();

    public constructor(
        private awsS3Client: AwsS3Client,
        private localStorageFileLinkCache: LocalStorageFileLinkCache,
        private fileCache: FileCache
    ) {}

    /**
     * Add a new download to the download manager.
     *
     * @param objectKey The S3 object key
     * @param versionId The S3 object version ID
     * @param elements The HTML elements that triggered the download
     *
     */
    public addNewDownLoad(
        objectKey: string,
        versionId: string,
        elements: HTMLElement[]
    ) {
        const downloadRecord: DownloadRecord = {
            objectKey: objectKey,
            versionId: versionId,
            startedAt: Date.now(),
            elements: elements,
        };

        const recordKey = `${objectKey}/${versionId}`;

        if (this.downloadRecords.has(recordKey)) {
            console.info(
                `${this.moduleName}::addNewDownload - Download record ${objectKey}/${versionId} already exists`
            );
            const existingRecord = this.downloadRecords.get(recordKey);
            existingRecord?.elements.push(...elements);
        } else {
            this.downloadRecords.set(recordKey, downloadRecord);
            this.startDownload(downloadRecord);
        }
    }

    /**
     * Remove a download record from the download manager.
     *
     * @param record
     *   The download record to remove
     */
    private removeDownloadRecord(record: DownloadRecord) {
        this.downloadRecords.delete(`${record.objectKey}/${record.versionId}`);
        console.debug(
            `${this.moduleName}::removeDownloadRecord - Record ${record.objectKey} removed`
        );
    }

    /**
     * Start the download process for a download record.
     *
     * @param record
     *  The download record to start the download for
     *
     */
    private async startDownload(record: DownloadRecord) {
        try {
            console.debug(
                `${this.moduleName}::startDownload - Starting download for a filenLink ${record.objectKey}`
            );

            const stream = await this.getObjectStream(
                record.objectKey,
                record.versionId
            );

            if (!stream) return;

            const processedLink = createS3FileLink(
                record.objectKey,
                record.versionId
            );

            await this.cacheFileLink(processedLink);
            await this.saveFileToCache(record, stream);

            this.removeDownloadRecord(record);
        } catch (error) {
            console.error(
                `${this.moduleName}::startDownload - Failed to retrieve object stream for ${record.objectKey}`,
                error
            );
            return null;
        }
    }

    /**
     * Get an object stream from S3.
     *
     * @param objectKey
     * @param versionId
     * @returns A readable stream if the object was found, null otherwise
     */
    private async getObjectStream(
        objectKey: string,
        versionId: string
    ): Promise<Readable | null> {
        try {
            return await this.awsS3Client.getObject(objectKey, versionId);
        } catch (error) {
            console.error(
                `${this.moduleName}::getObjectStream - Failed to retrieve object stream for ${objectKey}`,
                error
            );
            return null;
        }
    }

    /**
     * Store metadata for a file link in the local storage cache.
     *
     * @param fileLink
     */
    private async cacheFileLink(fileLink: S3FileLink) {
        try {
            this.localStorageFileLinkCache.cacheFileLink(fileLink);
        } catch (error) {
            console.error(
                `${this.moduleName}::cacheFileLink - Failed to cache file link: ${fileLink.objectKey}`,
                error
            );
        }
    }

    /**
     * Store an actual file in the cache folder.
     *
     * @param record
     * @param stream
     */
    private async saveFileToCache(record: DownloadRecord, stream: Readable) {
        try {
            await this.fileCache.saveFileToCacheFolder(
                record.objectKey,
                record.versionId,
                stream
            );

            console.debug(`${this.moduleName}::saveFileToCache - File saved`);

            emitter.emit(EVENT_DOWNLOAD_FINISHED, {
                record: record,
                stream: stream,
            });
        } catch (error) {
            console.error(
                `${this.moduleName}::saveFileToCache - Failed to save file to cache for ${record.objectKey}`,
                error
            );
        }
    }
}
