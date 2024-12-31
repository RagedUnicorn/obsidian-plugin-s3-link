import { S3ServiceException } from "@aws-sdk/client-s3";

export function handleS3Error(
    error: unknown,
    moduleName: string,
    operation: string
): void {
    if (error instanceof S3ServiceException) {
        const errorName = error.name;

        switch (errorName) {
            case "NoSuchKey":
            case "NotFound":
                console.warn(`${moduleName}::${operation} - Object not found.`);
                break;
            case "AccessDenied":
                console.error(
                    `${moduleName}::${operation} - Access denied: ${error.message}`
                );
                break;
            case "InvalidAccessKeyId":
                console.error(
                    `${moduleName}::${operation} - Invalid AWS Access Key ID: ${error.message}`
                );
                break;
            case "SignatureDoesNotMatch":
                console.error(
                    `${moduleName}::${operation} - Signature mismatch: ${error.message}`
                );
                break;
            case "CredentialsProviderError":
            case "CredentialsError":
                console.error(
                    `${moduleName}::${operation} - AWS credentials error: ${error.message}`
                );
                break;
            case "NetworkingError":
                console.error(
                    `${moduleName}::${operation} - Network error: ${error.message}`
                );
                break;
            case "ServiceUnavailable":
                console.error(
                    `${moduleName}::${operation} - AWS service unavailable: ${error.message}`
                );
                break;
            case "InternalError":
                console.error(
                    `${moduleName}::${operation} - Internal AWS error: ${error.message}`
                );
                break;
            default:
                console.error(
                    `${moduleName}::${operation} - Unhandled AWS error: ${error.message}`
                );
                throw error;
        }

        throw error;
    }

    // Handle non-AWS errors
    console.error(
        `${moduleName}::${operation} - Unknown error occurred:`,
        error
    );
    throw error;
}
