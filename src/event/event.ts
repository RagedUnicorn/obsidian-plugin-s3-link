import mitt, { Emitter } from "mitt";

import S3SignedLink from "../core/s3SignedLink";
import S3FileLink from "../core/s3FileLink";
import DownloadRecord from "../network/downloadRecord";
import { Readable } from "stream";

export const EVENT_FILE_LINK_PROCESSED = "fileLinkProcessed";
export const EVENT_SIGN_LINK_PROCESSED = "signLinkProcessed";
export const EVENT_DOWNLOAD_FINISHED = "downloadFinished";
export const EVENT_UI_MESSAGE = "uiMessage";

type Events = {
    [EVENT_SIGN_LINK_PROCESSED]: {
        elements: HTMLElement[];
        s3SignedLink: S3SignedLink;
    };
    [EVENT_FILE_LINK_PROCESSED]: {
        elements: HTMLElement[];
        s3FileLink: S3FileLink;
    };
    [EVENT_DOWNLOAD_FINISHED]: {
        record: DownloadRecord;
        stream: Readable;
    };
    [EVENT_UI_MESSAGE]: {
        message: string;
        duration?: number;
    };
};

export const emitter: Emitter<Events> = mitt();
