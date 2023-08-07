import { TFile } from "obsidian";
import Config from "./config";
import S3Link from "./model/s3Link";
import * as path from "path";

export function getVaultResourcePath(arg: S3Link): string;

export function getVaultResourcePath(arg: TFile): string;

export function getVaultResourcePath(arg: S3Link | TFile): string;

export function getVaultResourcePath(arg: S3Link | TFile): string {
    let loadedFile: TFile | null = null;

    if (arg instanceof S3Link) {
        const fileExtension = path.extname(arg.objectKey);
        const filePath = `${Config.CACHE_FOLDER}/${arg.versionId}${fileExtension}`;

        loadedFile = getAbstractFileByPath(filePath);

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

function getAbstractFileByPath(path: string): TFile | null {
    const loadedFile: TFile | null = app.vault.getAbstractFileByPath(
        path
    ) as TFile;

    return loadedFile;
}
