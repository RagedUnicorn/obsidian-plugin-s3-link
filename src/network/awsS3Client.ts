import {
    S3Client,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectVersionsCommand,
    ListObjectVersionsCommandOutput,
} from "@aws-sdk/client-s3";
import { handleS3Error } from "./awsErrorHandler";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

import Config from "../config/config";
import AwsCredentialProvider from "../aws/awsCredentialProvider";
import AwsCredential from "../aws/awsCredential";
import PluginStateManager from "../core/pluginStateManager";

export default class AwsS3Client {
    private readonly moduleName = "AwsS3Client";
    private awsS3Client!: S3Client;
    private awsCredentialProvider = new AwsCredentialProvider();

    constructor(private pluginStateManager: PluginStateManager) {
        this.pluginStateManager.subscribeToSettings(
            this.updateSettings.bind(this)
        );
    }

    /**
     * Initialize the AWS client asynchronously.
     *
     * @throws Error if the client cannot be initialized.
     */
    public async init() {
        await this.createS3Client();
    }

    /**
     * Unload the AWS client.
     *
     * Cleans up resources and destroys the client instance.
     */
    public unload() {
        this.awsS3Client?.destroy();
    }

    /**
     * Update the plugin settings dynamically.
     *
     * Recreates the S3 client with the updated settings.
     */
    public async updateSettings() {
        console.debug(`${this.moduleName}::updateSettings - Updating settings`);

        await this.createS3Client();

        console.debug(`${this.moduleName}::updateSettings - Settings updated`);
    }

    /**
     * Create an S3 client using the provided settings.
     *
     * @throws Error if AWS credentials are missing or invalid.
     */
    private async createS3Client() {
        const credentials: AwsCredential | null =
            await this.awsCredentialProvider.getAwsCredentials(
                this.pluginStateManager.getSettings().profile
            );
        if (credentials) {
            this.awsS3Client = new S3Client({
                region: this.pluginStateManager.getSettings().region,
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
            // TODO Throw an error instead of console.error
            console.error("Credentials not found");
        }
    }

    /**
     * Get a signed URL for an object in the S3 bucket.
     *
     * @param objectKey - The key of the object in S3.
     *
     * @returns A signed URL for the object.
     *
     * @throws Error if the client is not initialized or the signed URL cannot be generated.
     */
    public async getSignedUrlForObject(objectKey: string): Promise<string> {
        console.debug(
            `${this.moduleName}::getSignedUrlForObject - Retrieving signed URL for object ${objectKey}`
        );

        this.isClientInitialized();

        try {
            const command = new GetObjectCommand({
                Bucket: this.pluginStateManager.getSettings().bucketName,
                Key: objectKey,
            });

            const signedUrl = await getSignedUrl(this.awsS3Client, command, {
                expiresIn: Config.S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS,
            });

            return signedUrl;
        } catch (error) {
            console.error(
                `${this.moduleName}::getSignedUrlForObject - Error retrieving signed URL for object ${objectKey}`,
                error
            );
            handleS3Error(error, this.moduleName, "getSignedUrlForObject");
            throw error;
        }
    }

    /**
     * Retrieve the latest version ID for the given object key.
     *
     * @param objectKey - The key of the object in S3.
     *
     * @returns The latest version ID of the object or undefined if not found.
     *
     * @throws Error if the metadata retrieval fails.
     */
    public async getLatestObjectVersion(
        objectKey: string
    ): Promise<string | undefined> {
        try {
            const response = await this.getObjectMetadata(objectKey);
            const VERSION_LATEST = 0;

            // filter the object versions to only contain the exact objectKey
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
                    `${this.moduleName}::getLatestObjectVersion - Retrieved versionId ${versionId} for object ${objectKey}`
                );

                return versionId;
            }
        } catch (error) {
            console.error(
                `${this.moduleName}::getLatestObjectVersion - Failed to retrieve object versionId`,
                error
            );

            handleS3Error(error, this.moduleName, "getLatestObjectVersion");
            throw error;
        }
    }

    /**
     * Get the metadata for an object in the S3 bucket.
     *
     * @param objectKey - The key of the object in S3.
     *
     * @returns The metadata of the object.
     *
     * @throws Error if the client is not initialized or the metadata cannot be retrieved.
     */
    private async getObjectMetadata(
        objectKey: string
    ): Promise<ListObjectVersionsCommandOutput> {
        console.debug(
            `${this.moduleName}::getObjectMetadata - Retrieving metadata for object ${objectKey}`
        );

        this.isClientInitialized();

        const command = new ListObjectVersionsCommand({
            Bucket: this.pluginStateManager.getSettings().bucketName,
            Prefix: objectKey,
        });
        const response = await this.awsS3Client.send(command);

        console.debug(
            `${this.moduleName}::getObjectMetadata - getObjectMetadata response`,
            response
        );

        return response;
    }

    /**
     * Get an object from the S3 bucket as a Readable stream.
     *
     * @param objectKey - The key of the object in S3.
     *
     * @param versionId - The version ID of the object.
     *
     * @returns A Readable stream of the object.
     *
     * @throws Error if the client is not initialized or the object cannot be retrieved.
     */
    public async getObject(
        objectKey: string,
        versionId: string
    ): Promise<Readable> {
        console.debug(
            `${this.moduleName}::getObject - Retrieving object ${objectKey}`
        );

        this.isClientInitialized();

        try {
            const command = new GetObjectCommand({
                Bucket: this.pluginStateManager.getSettings().bucketName,
                Key: objectKey,
                VersionId: versionId,
            });
            const response = await this.awsS3Client.send(command);

            if (response.Body) {
                const stream = this.browserStreamToReadable(
                    response.Body as ReadableStream
                );

                return stream;
            } else {
                throw new Error(
                    `${this.moduleName}::getObject - Error retrieving object from S3`
                );
            }
        } catch (error) {
            console.error(
                `${this.moduleName}::getObject - Error retrieving object from S3`,
                error
            );
            handleS3Error(error, this.moduleName, "getObject");
            throw error;
        }
    }

    /**
     * Convert a browser stream to a Node.js Readable stream.
     *
     * @param browserStream - The browser stream to convert.
     *
     * @returns A Node.js Readable stream.
     */
    private browserStreamToReadable(
        browserStream: ReadableStream<Uint8Array>
    ): Readable {
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

    /**
     * Check if an object exists in the S3 bucket.
     *
     * @param objectKey - The key of the object in S3.
     *
     * @returns A boolean indicating whether the object exists.
     *
     * @throws Error if the client is not initialized or the existence check fails.
     */
    public async doesFileForObjectKeyExist(
        objectKey: string
    ): Promise<boolean> {
        console.debug(
            `${this.moduleName}::doesFileForObjectKeyExist - Checking if object ${objectKey} exists in S3 Bucket`
        );

        this.isClientInitialized();

        try {
            const headCommand = new HeadObjectCommand({
                Bucket: this.pluginStateManager.getSettings().bucketName,
                Key: objectKey,
            });

            await this.awsS3Client.send(headCommand);

            return true;
        } catch (error) {
            console.warn(
                `${this.moduleName}::doesFileForObjectKeyExist - Object ${objectKey} does not exist in S3 Bucket`
            );
            handleS3Error(error, this.moduleName, "doesFileForObjectKeyExist");

            return false;
        }
    }

    /**
     * Check if the awsS3Client is initialized.
     *
     * @throws Error if the client is not initialized.
     */
    private async isClientInitialized() {
        if (!this.awsS3Client) {
            throw new Error(
                `${this.moduleName}::isClientInitialized - S3Client not initialized`
            );
        }
    }
}
