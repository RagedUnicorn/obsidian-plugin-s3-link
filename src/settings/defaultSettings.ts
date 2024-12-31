import { PluginSettings } from "./pluginSettings";

// TODO hardcoded values
export const DEFAULT_SETTINGS: Partial<PluginSettings> = {
    bucketName: "ragedunicorn-obsidian-plugin-s3-link-test-assets",
    region: "eu-central-1",
    accessKeyId: "",
    secretAccessKey: "",
    profile: "default",
};
