import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PluginSettings } from "../settings/settings";
import Config from "../config";
import AwsCredentialProvider from "../aws/awsCredentialProvider";
import AwsCredential from "../aws/awsCredential";

export class AwsS3Client {
    private readonly moduleName = "AwsClient";
    private awsS3Client: S3Client;
    private awsCredentialProvider = new AwsCredentialProvider();

    private pluginSettings: PluginSettings;

    constructor(pluginSettings: PluginSettings) {
        this.pluginSettings = pluginSettings;
    }

    /**
     * Initialize the AWS client asynchronously.
     */
    public async init() {
        await this.createS3Client();
    }

    /**
     * Create an S3 client using the provided settings.
     */
    private async createS3Client() {
        const credentials: AwsCredential | null =
            await this.awsCredentialProvider.getAwsCredentials(
                this.pluginSettings.profile
            );
        if (credentials) {
            this.awsS3Client = new S3Client({
                region: this.pluginSettings.region,
                credentials: {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                },
            });
        } else {
            /**
             * If the credentials are not found, set the plugin state to error and reset the profile setting.
             * This case can happen if the user had a profile set and then deleted the profile from the credentials file.
             */
            // TODO
            console.error("Credentials not found");
        }
    }

    /**
     * Get a signed URL for an object in the S3 bucket.
     *
     * @param objectKey
     * @returns
     */
    public async getSignedUrlForObject(objectKey: string): Promise<string> {
        console.debug(
            `${this.moduleName}::getSignedUrlForObject - Retrieving signed URL for object ${objectKey}`
        );

        if (!this.awsS3Client) {
            throw new Error("S3Client not initialized");
        }

        try {
            // Create a GetObjectCommand with the bucket and object key
            const command = new GetObjectCommand({
                Bucket: this.pluginSettings.bucketName,
                Key: objectKey,
            });

            // Generate the signed URL
            const signedUrl = await getSignedUrl(this.awsS3Client, command, {
                expiresIn: Config.S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS,
            });

            return signedUrl;
        } catch (error) {
            console.error(
                `${this.moduleName} - Error generating signed URL:`,
                error
            );
            throw error; // TODO do we want to throw the error or return null?
        }
    }
}
