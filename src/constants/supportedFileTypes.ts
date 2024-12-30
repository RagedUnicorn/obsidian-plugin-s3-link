import * as path from "path";

export const SUPPORTED_FILE_TYPES = {
    images: ["avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp"],
    video: ["mkv", "mov", "mp4", "ogv", "webm"],
    audio: ["flac", "m4a", "mp3", "ogg", "wav", "3gp"],
    pdf: ["pdf"],
};

export enum DISPLAY_TYPE {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    INVALID = "invalid",
}

const FILE_TYPE_TO_DISPLAY_TYPE: { [key: string]: DISPLAY_TYPE } = {
    images: DISPLAY_TYPE.IMAGE,
    video: DISPLAY_TYPE.VIDEO,
    audio: DISPLAY_TYPE.AUDIO,
};

/**
 * Determine the file type by extension.
 *
 * @param extension - File extension without the dot.
 * @returns Corresponding DISPLAY_TYPE.
 */
function getFileType(extension: string): DISPLAY_TYPE {
    for (const [type, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
        if (extensions.includes(extension)) {
            return FILE_TYPE_TO_DISPLAY_TYPE[type] || DISPLAY_TYPE.INVALID;
        }
    }
    return DISPLAY_TYPE.INVALID;
}

/**
 * Get the display type by object key. Determines if the object is an image, audio, video, or invalid.
 *
 * @param objectKey - The key to determine its display type.
 * @returns Corresponding DISPLAY_TYPE.
 */
export function getDisplayTypeByObjectKey(objectKey: string): DISPLAY_TYPE {
    const extension = path.extname(objectKey).slice(1).toLowerCase();
    return getFileType(extension);
}
