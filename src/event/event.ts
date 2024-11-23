import mitt, { Emitter } from "mitt";
import S3SignedLink from "../model/s3SignedLink";
import S3FileLink from "../model/s3FileLink";

type Events = {
    signLinkProcessed: { elements: HTMLElement[]; s3SignedLink: S3SignedLink };
    fileLinkProcessed: {
        elements: HTMLElement[];
        s3FileLink: S3FileLink;
    };
};

export const emitter: Emitter<Events> = mitt();
