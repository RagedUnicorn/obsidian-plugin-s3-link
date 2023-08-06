import Config from "../config";

const moduleName = "Settings";

export interface PluginSettings {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    profile: string;
}

export const DEFAULT_SETTINGS: Partial<PluginSettings> = {
    bucketName: "",
    region: "eu-central-1",
    accessKeyId: "",
    secretAccessKey: "",
    profile: "",
};

export const REGIONS = {
    "us-east-2": "US East (Ohio)",
    "us-east-1": "US East (N. Virginia)",
    "us-west-1": "US West (N. California)",
    "us-west-2": "US West (Oregon)",
    "af-south-1": "Africa (Cape Town)",
    "ap-east-1": "Asia Pacific (Hong Kong)",
    "ap-south-2": "Asia Pacific (Hyderabad)",
    "ap-southeast-3": "Asia Pacific (Jakarta)",
    "ap-southeast-4": "Asia Pacific (Melbourne)",
    "ap-south-1": "Asia Pacific (Mumbai)",
    "ap-northeast-3": "Asia Pacific (Osaka)",
    "ap-northeast-2": "Asia Pacific (Seoul)",
    "ap-southeast-1": "Asia Pacific (Singapore)",
    "ap-southeast-2": "Asia Pacific (Sydney)",
    "ap-northeast-1": "Asia Pacific (Tokyo)",
    "ca-central-1": "Canada (Central)",
    "eu-central-1": "Europe (Frankfurt)",
    "eu-west-1": "Europe (Ireland)",
    "eu-west-2": "Europe (London)",
    "eu-south-1": "Europe (Milan)",
    "eu-west-3": "Europe (Paris)",
    "eu-south-2": "Europe (Spain)",
    "eu-north-1": "Europe (Stockholm)",
    "eu-central-2": "Europe (Zurich)",
    "me-south-1": "Middle East (Bahrain)",
    "me-central-1": "Middle East (UAE)",
    "sa-east-1": "South America (São Paulo)",
};

export function isPluginReadyState(settings: PluginSettings): boolean {
    if (settings.bucketName === "") {
        console.info(
            `${moduleName} - Settings is not in valid state, bucketName is empty`
        );

        return false;
    }

    if (settings.region === "") {
        console.info(
            `${moduleName} - Settings is not in valid state, region is empty`
        );

        return false;
    }

    if (
        settings.profile === "" ||
        settings.profile === Config.AWS_PROFILE_NAME_NONE
    ) {
        console.debug(
            `${moduleName} - Profile in settings is not set checking for accessKeyId and secretAccessKey`
        );

        if (settings.accessKeyId === "" || settings.secretAccessKey === "") {
            console.info(
                `${moduleName} - Settings is not in valid state, profile is empty and accessKeyId and secretAccessKey are empty`
            );

            return false;
        }
    }

    return true;
}
