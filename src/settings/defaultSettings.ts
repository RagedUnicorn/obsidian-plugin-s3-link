import { PluginSettings } from "./pluginSettings";

export const DEFAULT_SETTINGS: Partial<PluginSettings> = {
    bucketName: "",
    region: "eu-central-1",
    accessKeyId: "",
    secretAccessKey: "",
    profile: "default",
};
