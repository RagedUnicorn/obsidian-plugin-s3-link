import { TFile, App, normalizePath } from "obsidian";

import * as path from "path";

import S3FileLink from "../model/s3FileLink";
import Config from "../config";

/**
 * Retrieves the resource path for a given S3 file link.
 *
 * @param s3FileLink The S3 file link.
 * @param app The Obsidian app instance.
 *
 * @returns The resource path.
 */
export async function getVaultResourcePath(
    s3FileLink: S3FileLink,
    app: App
): Promise<string> {
    const fileExtension = path.extname(s3FileLink.objectKey);
    const filePath = normalizePath(
        `${Config.S3_FILE_LINK_CACHE_FOLDER}/${s3FileLink.versionId}${fileExtension}`
    );
    const loadedFile = await this.getAbstractFileWithRetry(app, filePath);

    if (loadedFile == null) {
        throw new Error(`Failed to retrieve resource path for ${s3FileLink}`);
    }

    return app.vault.getResourcePath(loadedFile);
}

/**
 * When files are not written with writeBinary, they are not immediately available. WriteBinary
 * is not being used to support writing files as streams. This is necessary for large files.
 * The function will retry multiple times to load the file and if it cannot it returns null. Usually
 * the file is available after 1-2 retries.
 *
 * @param app the Obsidian app
 * @param path the relative path of the file to load
 * @param retries the number of retries
 * @param interval the interval between retries in milliseconds
 *
 * @returns a TFile or null if the file could not be loaded
 */
export async function getAbstractFileWithRetry(
    app: App,
    path: string,
    retries = 10,
    interval = 100
): Promise<TFile | null> {
    for (let i = 0; i < retries; i++) {
        const file = app.vault.getAbstractFileByPath(path);

        if (file) {
            if (file instanceof TFile) {
                return file as TFile;
            } else {
                // file can be a TFolder but is not expected here
                throw new Error(`File is not a TFile: ${file}`);
            }
        }

        await new Promise((res) => setTimeout(res, interval));
    }

    return null;
}

/**
 * Normalizes the version ID by removing leading non-alphanumeric characters.
 *
 * @param versionId The version ID.
 *
 * @returns The normalized version ID.
 */
export function normalizeVersionId(versionId: string): string {
    return versionId.replace(/[^\w]/g, "");
}
