import mitt, { Emitter } from "mitt";

import S3SignedLink from "../model/s3SignedLink";
import S3FileLink from "../model/s3FileLink";

export const EVENT_FILE_LINK_PROCESSED = "fileLinkProcessed";
export const EVENT_SIGN_LINK_PROCESSED = "signLinkProcessed";

type Events = {
    [EVENT_SIGN_LINK_PROCESSED]: {
        elements: HTMLElement[];
        s3SignedLink: S3SignedLink;
    };
    [EVENT_FILE_LINK_PROCESSED]: {
        elements: HTMLElement[];
        s3FileLink: S3FileLink;
    };
};

export const emitter: Emitter<Events> = mitt();
