/* eslint-disable @typescript-eslint/no-var-requires */

import * as fs from "fs";
import * as os from "os";
import AwsProfile from "./awsProfile";
import AwsCredential from "./awsCredential";
import Config from "../config";

const path = require("path");

/**
 * AWS AwsCredentialProvider
 *
 * A helper for retrieving profiles and credentials from the AWS credentials file in the users home directory
 *
 */
export default class AwsCredentialProvider {
    private readonly moduleName = "AwsCredentialProvider";
    profiles: AwsProfile[] = [];

    /**
     * Get all AWS profiles from credentials file and make them available as list of AwsProfile objects
     *
     * @returns {Promise<AwsProfile[]>}
     */
    async getAwsProfiles(): Promise<AwsProfile[]> {
        console.debug(
            `${this.moduleName}::getAwsProfiles - Retrieving profiles`
        );

        try {
            const credentialsFilePath = await this.getCredentialsFilePath();
            const parsedCredentialsContent =
                await this.getCredentialsFileContent(credentialsFilePath);

            // insert no profile set option
            this.profiles.push(new AwsProfile(Config.AWS_PROFILE_NAME_NONE));

            for (const [, value] of Object.entries(parsedCredentialsContent)) {
                const profile = new AwsProfile(value.profileName);
                this.profiles.push(profile);
            }

            return this.profiles;
        } catch (error) {
            console.error(
                `${this.moduleName}: Failed to retrieve profiles`,
                error
            );
        }

        return [];
    }

    /**
     * Get AWS credentials for a given profile name
     *
     * @param profileName the profile name to retrieve credentials for
     *
     * @returns the credentials for the given profile name or null if no credentials were found
     */
    async getAwsCredentials(
        profileName: string
    ): Promise<AwsCredential | null> {
        console.debug(
            `${this.moduleName}::getAwsCredentials - Retrieving credentials for profile ${profileName}`
        );

        try {
            const credentialsFilePath = await this.getCredentialsFilePath();
            const parsedCredentialsContent =
                await this.getCredentialsFileContent(credentialsFilePath);

            for (const [, value] of Object.entries(parsedCredentialsContent)) {
                if (value.profileName === profileName) {
                    console.info(
                        `${this.moduleName}: Found credentials for profile ${profileName}`
                    );
                    return value;
                }
            }
        } catch (error) {
            console.info(
                `${this.moduleName}: Failed to retrieve aws credentials from ${Config.AWS_CREDENTIALS_FILE_PATH}`,
                error
            );

            return null;
        }

        return null;
    }

    /**
     * Get credentials file path
     *
     * @returns the credentials file path
     */
    private async getCredentialsFilePath(): Promise<string> {
        console.debug(
            `${this.moduleName}::getCredentialsFilePath - Retrieving credentials file path`
        );

        const filePath = path.join(
            os.homedir(),
            Config.AWS_CREDENTIALS_FILE_PATH
        );

        try {
            await fs.promises.access(filePath, fs.constants.F_OK);

            return filePath;
        } catch (error) {
            throw new Error("Cannot find credentials file");
        }
    }

    /**
     *
     * @param credentialsFilePath the credentials file path
     *
     * @returns the credentials file content
     */
    private async getCredentialsFileContent(
        credentialsFilePath: string
    ): Promise<AwsCredential[]> {
        console.debug(
            `${this.moduleName}::getCredentialsFileContent - Retrieving credentials file content`
        );

        const awsCredentials: AwsCredential[] = [];
        const credentialsFileContent = (
            await fs.promises.readFile(credentialsFilePath)
        ).toString("utf8");

        const parsedCredentialsContent = this.parseIni(credentialsFileContent);

        for (const [key, value] of Object.entries(parsedCredentialsContent)) {
            const awsCredential = new AwsCredential(key, value);
            awsCredentials.push(awsCredential);
        }

        return awsCredentials;
    }

    /**
     * Parse ini file content
     *
     * @param input Content to parse as ini file
     *
     * @returns Parsed ini file content
     */
    private parseIni(input: string): {
        [key: string]: string | { [key: string]: string };
    } {
        const result: { [key: string]: string | { [key: string]: string } } =
            {};
        let section = result;

        input.split("\n").forEach((line) => {
            let match;
            if ((match = line.match(/^\s*\[\s*([^\]]*)\s*\]\s*$/))) {
                section = result[match[1]] = {};
            } else if ((match = line.match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/))) {
                section[match[1]] = match[2];
            }
        });

        return result;
    }
}
