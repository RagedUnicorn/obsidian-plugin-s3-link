import mitt, { Emitter } from "mitt";
import S3SignedLink from "../model/s3SignedLink";

type Events = {
    signLinkProcessed: { elements: HTMLElement[]; s3SignedLink: S3SignedLink };
};

export const emitter: Emitter<Events> = mitt();
