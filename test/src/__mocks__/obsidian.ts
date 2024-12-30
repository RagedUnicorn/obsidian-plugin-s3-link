export class App {
    vault = {
        adapter: {
            exists: jest.fn(),
            getBasePath: jest.fn(),
        },
        createFolder: jest.fn(),
        getResourcePath: jest.fn(),
        getAbstractFileByPath: jest.fn(),
    };
}

export function normalizePath(path: string): string {
    return path;
}

export class FileSystemAdapter {
    getBasePath(): string {
        return "/mocked/base/path";
    }
}

export class TFile {
    path: string;
    constructor(path: string) {
        this.path = path;
    }
}
