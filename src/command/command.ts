import S3LinkPlugin from "src/main";

export default abstract class Command {
	protected abstract readonly moduleName: string;
	protected abstract readonly commandId: string;
	protected abstract readonly commandName: string;

	public abstract addCommand(plugin: S3LinkPlugin): void;
	// protected abstract executeCommand(input: any): void; TODO clean up
}