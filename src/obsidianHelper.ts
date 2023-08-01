import { TFile } from "obsidian";
import { Config } from "./config";
import { S3Link } from "./model/s3Link";
import * as path from "path";

export function getVaultResourcePath(s3Link: S3Link): string;

export function getVaultResourcePath(file: TFile): string;

export function getVaultResourcePath(arg: S3Link | TFile): string {
    let loadedFile: TFile | null = null;

    if (arg instanceof S3Link) {
        const fileExtension = path.extname(arg.objectKey);
        const filePath = `${Config.CACHE_FOLDER}/${arg.versionId}${fileExtension}`;

        loadedFile = getAbstractFileByPath(filePath);

        if (loadedFile == null) {
            throw new Error(`Could not load file '${filePath}'`);
        }
    } else {
        loadedFile = <TFile>arg;
    }

    const resourcePath = app.vault.getResourcePath(loadedFile);

    return resourcePath;
}

function getAbstractFileByPath(path: string): TFile | null {
    const loadedFile: TFile | null = app.vault.getAbstractFileByPath(
        path
    ) as TFile;

    return loadedFile;
}
