import { TFile } from "obsidian";
import Config from "./config";
import S3Link from "./model/s3Link";
import * as path from "path";

export async function getVaultResourcePath(arg: S3Link): Promise<string>;

export async function getVaultResourcePath(arg: TFile): Promise<string>;

export async function getVaultResourcePath(
    arg: S3Link | TFile
): Promise<string>;

export async function getVaultResourcePath(
    arg: S3Link | TFile
): Promise<string> {
    let loadedFile: TFile | null = null;

    if (arg instanceof S3Link) {
        const fileExtension = path.extname(arg.objectKey);
        const filePath = `${Config.CACHE_FOLDER}/${arg.versionId}${fileExtension}`;

        loadedFile = await getAbstractFileWithRetry(filePath);

        if (loadedFile == null) {
            throw new Error(`Could not load file '${filePath}'`);
        }
    } else if (arg instanceof TFile) {
        loadedFile = <TFile>arg;
    } else {
        throw new Error("Invalid argument");
    }

    return app.vault.getResourcePath(loadedFile);
}

/**
 * When files are not written with writeBinary, they are not immediately available. WriteBinary
 * is not being used to support writing files as streams. This is necessary for large files.
 * The function will retry multiple times to load the file and if it cannot it returns null. Usually
 * the file is available after 1-2 retries.
 *
 * @param path the path of the file to load
 * @param retries the number of retries
 * @param interval the interval between retries in milliseconds
 *
 * @returns a TFile or null if the file could not be loaded
 */
async function getAbstractFileWithRetry(
    path: string,
    retries = 10,
    interval = 100
): Promise<TFile | null> {
    for (let i = 0; i < retries; i++) {
        const file = app.vault.getAbstractFileByPath(path);

        if (file) {
            return file as TFile;
        }

        await new Promise((res) => setTimeout(res, interval));
    }

    return null;
}
