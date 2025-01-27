import S3LinkPlugin from "../main";

export default abstract class Command {
    protected abstract readonly moduleName: string;
    protected abstract readonly commandId: string;
    protected abstract readonly commandName: string;

    protected abstract addCommand(plugin: S3LinkPlugin): void;
    protected abstract executeCommand(...args: unknown[]): void;
}
