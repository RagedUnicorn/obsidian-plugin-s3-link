import S3SignedLink from "./model/s3SignedLinks";
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
    }): Promise<Map<S3SignedLink, HTMLElement[]>> {
        const resolvedS3Links: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.objectKeys.entries()),
        ]);

        const resolvedS3SignLinks: Map<string, HTMLElement[]> = new Map([
            ...Array.from(resolvedS3ImageLinks.signObjectKeys.entries()),
        ]);

        // await this.processS3Links(resolvedS3Links);
        return await this.processS3SignLinks(resolvedS3SignLinks);
    }

    /**
     * Process S3 sign links
     *
     * @param resolvedS3SignLinks
     *     A map of object keys to their respective HTML elements
     * @returns Map<S3SignedLink, HTMLElement[]>
     *     A map of s3 signed links to their respective HTML elements or an empty map if no links were processed
     */
    private async processS3SignLinks(
        resolvedS3SignLinks: Map<string, HTMLElement[]>
    ): Promise<Map<S3SignedLink, HTMLElement[]>> {
        await this.awsS3Client.init();

        let processedLinks: Map<S3SignedLink, HTMLElement[]> = new Map();

        for (const [objectKey, htmlElements] of resolvedS3SignLinks) {
            console.debug(
                `${this.moduleName} - Processing S3 signLink ${objectKey}`
            );

            try {
                const signedUrl = await this.awsS3Client.getSignedUrlForObject(
                    objectKey
                );

                if (signedUrl != null) {
                    console.debug(
                        `${this.moduleName} - Processed signed URL`,
                        signedUrl
                    );

                    let processedLink = new S3SignedLink(
                        objectKey,
                        Date.now(),
                        signedUrl
                    );

                    processedLinks.set(processedLink, htmlElements);
                }
            } catch (error) {
                console.error(
                    `${this.moduleName} - Error processing S3 signLink ${objectKey} ignoring link`,
                    error
                );
            }
        }

        return processedLinks;
    }

    // TODO I think the link processor should be responsible for processing the links
    // The result for the sign links should be a map of object keys to signed URLs
    // subsequently the processor markdown or codemirror can then do whatever it wants with that signed urls
    // for normal s3 links should be responsible for starting the process of retrieving the object
    // then returning a list of object keys and their respective files for it (is this a good idea? what if the file is too large? once one item is downloaded it should be displayed immediately)
}
