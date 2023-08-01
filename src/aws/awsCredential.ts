/**
 * AWS Credential
 *
 * Holding a single AWS credential
 *
 */
export class AwsCredential {
    profileName: string;
    accessKeyId: string;
    secretAccessKey: string;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    constructor(profileName: string, data: any) {
        this.profileName = profileName;
        this.accessKeyId = data.aws_access_key_id;
        this.secretAccessKey = data.aws_secret_access_key;
    }
}
