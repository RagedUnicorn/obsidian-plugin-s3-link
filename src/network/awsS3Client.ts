import {
    S3Client,
    GetObjectCommand,
    ListObjectVersionsCommand,
    ListObjectVersionsCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PluginSettings } from "../settings/settings";
import Config from "../config";
import AwsCredentialProvider from "../aws/awsCredentialProvider";
import AwsCredential from "../aws/awsCredential";

import { Readable } from "stream";

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
            const VERSION_LATEST = 0;

            // Filter the object versions to only contain the exact objectKey
            const exactFilteredVersion =
                response.Versions?.filter(
                    (version) => version.Key === objectKey
                ) || [];

            if (
                exactFilteredVersion != null &&
                exactFilteredVersion.length > 0
            ) {
                const versionId =
                    exactFilteredVersion[VERSION_LATEST].VersionId;
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

    /**
     * Get the metadata for an object in the S3 bucket.
     *
     * @param objectKey
     * @returns
     */
    private async getObjectMetadata(
        objectKey: string
    ): Promise<ListObjectVersionsCommandOutput> {
        if (!this.awsS3Client) {
            throw new Error("S3Client not initialized");
        }

        const command = new ListObjectVersionsCommand({
            Bucket: this.pluginSettings.bucketName,
            Prefix: objectKey,
        });
        const response = await this.awsS3Client.send(command);

        console.debug(
            `${this.moduleName}: getObjectMetadata response`,
            response
        );

        return response;
    }

    /**
     * Get an object from the S3 bucket.
     *
     * @param objectKey
     * @returns
     */
    public async getObject(objectKey: string): Promise<Readable> {
        console.debug(
            `${this.moduleName}::getObject - Retrieving object ${objectKey}`
        );

        if (!this.awsS3Client) {
            throw new Error("S3Client not initialized");
        }

        try {
            const command = new GetObjectCommand({
                Bucket: this.pluginSettings.bucketName,
                Key: objectKey,
            });
            const response = await this.awsS3Client.send(command);

            if (response.Body) {
                const stream = this.browserStreamToReadable(
                    response.Body as ReadableStream
                );

                stream.on("end", () => {
                    //
                });

                return stream;
            } else {
                throw new Error(
                    `${this.moduleName}::getObject - Error retrieving object from S3`
                );
            }
        } catch (error) {
            // error state TODO
            console.error(
                `${this.moduleName} - Error retrieving object`,
                error
            );
            throw error;
        }
    }

    /**
     * TODO document this
     * @param browserStream
     * @returns
     */
    private browserStreamToReadable(browserStream: ReadableStream): Readable {
        const reader = browserStream.getReader();
        return new Readable({
            async read() {
                const result = await reader.read();
                if (result.done) {
                    this.push(null);
                } else {
                    this.push(Buffer.from(result.value));
                }
            },
        });
    }
}
