/**
 * AWS Credential
 *
 * Holding a single AWS credential
 *
 */
export default class AwsCredential {
    profileName: string;
    accessKeyId: string;
    secretAccessKey: string;

    constructor(profileName: string, data: Record<string, string>) {
        this.profileName = profileName;
        this.accessKeyId = data.aws_access_key_id;
        this.secretAccessKey = data.aws_secret_access_key;
    }
}
