import { PluginSettings } from "./settings/settings";
import {
    S3Client,
    GetObjectCommand,
    ListObjectVersionsCommand,
    ListObjectVersionsCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import AwsCredentialProvider from "./aws/awsCredentialProvider";
import AwsCredential from "./aws/awsCredential";
import Config from "./config";
import S3LinkPlugin from "./main";
import { PluginState } from "./pluginState";
import { sendNotification } from "./ui/notification";
import { isPluginReadyState } from "./settings/settings";

export class Client {
    private readonly moduleName = "Client";
    private s3Client: S3Client | null;
    private awsCredentialProvider = new AwsCredentialProvider();
    private settings: PluginSettings;
    private plugin: S3LinkPlugin;

    constructor(settings: PluginSettings, plugin: S3LinkPlugin) {
        this.settings = settings;
        this.plugin = plugin;
    }

    private async createS3Client() {
        if (isPluginReadyState(this.settings)) {
            if (
                this.settings.profile !== "" &&
                this.settings.profile !== Config.AWS_PROFILE_NAME_NONE
            ) {
                const credentials: AwsCredential | null =
                    await this.awsCredentialProvider.getAwsCredentials(
                        this.settings.profile
                    );

                if (credentials) {
                    this.s3Client = new S3Client({
                        region: this.settings.region,
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
                    this.plugin.setState(PluginState.ERROR);
                    this.settings.profile = "";
                    await this.plugin.saveSettings();
                    sendNotification(
                        "Failed to retrieve credentials for profile - Please check Settings"
                    );
                    this.s3Client = null;
                }
            } else {
                this.s3Client = new S3Client({
                    region: this.settings.region,
                    credentials: {
                        accessKeyId: this.settings.accessKeyId,
                        secretAccessKey: this.settings.secretAccessKey,
                    },
                });
            }
        } else {
            this.s3Client = null;
        }
    }

    /**
     * Allows for the reinitialization of the S3Client with new settings.
     *
     * @param settings PluginSettings containing the new settings
     */
    public initializeS3Client(settings: PluginSettings) {
        this.settings = settings;
        this.createS3Client();
    }

    /**
     * Retrievees the latest versionId for the given objectKey.
     *
     * @param objectKey The objectKey of the object to retrieve the latest versionId for
     *
     * @returns Promise<string | undefined> containing the latest versionId or undefined if the object does not exist
     */
    public async getLatestObjectVersion(
        objectKey: string
    ): Promise<string | undefined> {
        try {
            const response = await this.getObjectMetadata(objectKey);
            const objectVersions = response.Versions;
            const VERSION_LATEST = 0;

            if (objectVersions != null) {
                const versionId = objectVersions[VERSION_LATEST].VersionId;
                console.debug(
                    `${this.moduleName}: Retrieved versionId ${versionId} for object ${objectKey}`
                );

                return versionId;
            }
        } catch (error) {
            console.error(
                `${this.moduleName}: Failed to retrieve object versionId`,
                error
            );

            throw error;
        }
    }

    private async getObjectMetadata(
        objectKey: string
    ): Promise<ListObjectVersionsCommandOutput> {
        if (!this.s3Client) {
            throw new Error("S3Client not initialized");
        }

        const command = new ListObjectVersionsCommand({
            Bucket: this.settings.bucketName,
            Prefix: objectKey,
        });
        const response = await this.s3Client.send(command);

        console.debug(
            `${this.moduleName}: getObjectMetadata response`,
            response
        );

        return response;
    }

    public async getObject(objectKey: string): Promise<Uint8Array> {
        if (!this.s3Client) {
            throw new Error("S3Client not initialized");
        }

        try {
            const command = new GetObjectCommand({
                Bucket: this.settings.bucketName,
                Key: objectKey,
            });
            const response = await this.s3Client.send(command);

            if (response.Body) {
                return await response.Body.transformToByteArray();
            } else {
                throw new Error(
                    `Failed to retrieve object ${objectKey} from S3`
                );
            }
        } catch (error) {
            console.error("Error retrieving object from S3", error);
            throw error;
        }
    }

    public async getSignedUrlForObject(objectKey: string): Promise<string> {
        console.debug(
            `${this.moduleName}::getSignedUrlForObject - Retrieving signed URL for object ${objectKey}`
        );

        if (!this.s3Client) {
            throw new Error("S3Client not initialized");
        }

        try {
            // Create a GetObjectCommand with the bucket and object key
            const command = new GetObjectCommand({
                Bucket: this.settings.bucketName,
                Key: objectKey,
            });

            // Generate the signed URL
            const signedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn: Config.S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS,
            });

            return signedUrl;
        } catch (error) {
            console.error("Error generating signed URL:", error);
            throw error;
        }
    }
}
