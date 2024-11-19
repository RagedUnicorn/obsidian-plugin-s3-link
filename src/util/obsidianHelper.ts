import { TFile, App } from "obsidian";
import S3Link from "../model/s3Link";
import Config from "../config";
import * as path from "path";

export async function getVaultResourcePath(
    arg: S3Link,
    app: App
): Promise<string>;

export async function getVaultResourcePath(
    arg: TFile,
    app: App
): Promise<string>;

export async function getVaultResourcePath(
    arg: S3Link | TFile,
    app: App
): Promise<string>;

export async function getVaultResourcePath(
    arg: S3Link | TFile,
    app: App
): Promise<string> {
    let loadedFile: TFile | null = null;

    if (arg instanceof S3Link) {
        // const fileExtension = path.extname(arg.objectKey);
        // const filePath = `${Config.CACHE_FOLDER}/${arg.versionId}${fileExtension}`;
        // loadedFile = await getAbstractFileWithRetry(filePath);
        if (loadedFile == null) {
            throw new Error(
                `Could not load file '${"filePath TODO TODO TODO"}'`
            );
        }
    } else if (arg instanceof TFile) {
        loadedFile = <TFile>arg;
    } else {
        throw new Error("Invalid argument");
    }

    return app.vault.getResourcePath(loadedFile);
}

export async function getResourcePath(
    resource: S3Link | TFile,
    objectKey: string,
    app: App
): Promise<string>;

export async function getResourcePath(
    resource: S3Link | TFile,
    objectKey: string,
    app: App
): Promise<string> {
    let resourcePath = "";

    try {
        resourcePath = await getVaultResourcePath(resource, app);
    } catch (error) {
        // sendNotification(
        // "Failed to retrieve cached item. Item will be reloaded next time you open the file or reload Obsidian."
        // );
        // this.cache.removeItemFromCache(objectKey);
    }

    return resourcePath;
}
