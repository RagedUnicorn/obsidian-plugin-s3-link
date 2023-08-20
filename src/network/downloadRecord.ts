import { DownloadState } from "./downloadState";

export type DownloadRecord = {
    objectKey: string;
    versionId: string;
    startedAt: number;
    downloadState: DownloadState;
};
