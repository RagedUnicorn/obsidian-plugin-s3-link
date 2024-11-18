import { AwsS3Client } from "./network/awsS3Client";
import { PluginSettings } from "./settings/settings";

export class LinkProcessor {
    private readonly moduleName = "LinkProcessor";
    pluginSettings: PluginSettings;
    awsS3Client: AwsS3Client;

    constructor(pluginSettings: PluginSettings) {
        console.info(`${this.moduleName}::constructor - LinkProcessor created`);
        this.pluginSettings = pluginSettings;
        this.awsS3Client = new AwsS3Client(this.pluginSettings);
    }

    public async processLinks(resolvedS3ImageLinks: {
        objectKeys: Map<string, HTMLElement[]>;
        signObjectKeys: Map<string, HTMLElement[]>;
    }) {
        const resolvedS3Links: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.objectKeys.entries()),
        ]);

        const resolvedS3SignLinks: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.signObjectKeys.entries()),
        ]);

        // await this.processS3Links(resolvedS3Links);
        await this.processS3SignLinks(resolvedS3SignLinks);
    }

    private async processS3SignLinks(
        resolvedS3SignLinks: Map<string, HTMLElement[]>
    ) {
        await this.awsS3Client.init();

        for (const [objectKey, htmlElements] of resolvedS3SignLinks) {
            console.debug(
                `${this.moduleName} - Processing S3 signLink ${objectKey}`
            );

            try {
                const signedUrl = await this.awsS3Client.getSignedUrlForObject(
                    objectKey
                );
                if (signedUrl != null) {
                    console.log(
                        `${this.moduleName} - Signed URL: ${signedUrl}`
                    );
                }
            } catch (error) {
                console.error(
                    `${this.moduleName} - Error processing S3 signLink ${objectKey} ignoring link`,
                    error
                );
            }
        }
    }
}
