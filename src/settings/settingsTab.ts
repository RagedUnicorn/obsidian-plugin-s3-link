import {
    App,
    PluginSettingTab,
    Setting,
    TextComponent,
} from "obsidian";

import S3LinkPlugin from "../main";
import { DEFAULT_SETTINGS } from "./defaultSettings";
import Config from "../config/config";
import { trimWhitespace } from "../utils/formatterUtils";

import { AWS_REGIONS } from "../aws/awsRegions";
import AwsProfile from "../aws/awsProfile";
import AwsCredentialProvider from "../aws/awsCredentialProvider";

import PluginStateManager from "../core/pluginStateManager";

export default class PluginSettingsTab extends PluginSettingTab {
    private pluginStateManager: PluginStateManager;
    awsAccessKeySetting!: Setting;
    awsSecretAccessKeySetting!: Setting;

    constructor(app: App, private plugin: S3LinkPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.pluginStateManager = plugin.pluginStateManager;
    }

    async display(): Promise<void> {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("S3 Bucket Name")
            .setDesc("The name of your S3 bucket")
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.bucketName ?? "")
                    .setValue(this.pluginStateManager.getSettings().bucketName)
                    .onChange(async (value) => {
                        const formatedValue = trimWhitespace(value);

                        this.pluginStateManager.getSettings().bucketName =
                            formatedValue;
                        await this.pluginStateManager.updateSettings({
                            bucketName: formatedValue,
                        });

                        text.setValue(formatedValue);
                    })
            );

        new Setting(containerEl)
            .setName("S3 Bucket Region")
            .setDesc("The region of your S3 bucket")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(AWS_REGIONS)
                    .setValue(this.pluginStateManager.getSettings().region)
                    .onChange(async (value) => {
                        this.pluginStateManager.getSettings().region = value;
                        await this.pluginStateManager.updateSettings({
                            region: value,
                        });
                    })
            );

        const awsCredentialProvider = new AwsCredentialProvider();
        const profiles = await awsCredentialProvider.getAwsProfiles();

        if (profiles.length > 0) {
            const fragment = document.createDocumentFragment();
            const description = document.createElement("div");

            description.setText(
                "The local profile to use for authentication. This is the recommended way for authentication."
            );
            fragment.appendChild(description);

            const warning = document.createElement("div");
            warning.setAttribute("class", "mod-warning");
            warning.setText(
                "Warning: If you use a profile, the access key and secret access key will be ignored."
            );
            fragment.appendChild(warning);

            new Setting(containerEl)
                .setName("AWS Profile")
                .setDesc(fragment)
                .addDropdown((dropdown) =>
                    dropdown
                        .addOptions(
                            profiles.reduce(
                                (
                                    acc: { [key: string]: string },
                                    profile: AwsProfile
                                ) => {
                                    acc[profile.name] = profile.name;
                                    return acc;
                                },
                                {}
                            )
                        )
                        .setValue(this.pluginStateManager.getSettings().profile)
                        .onChange(async (value) => {
                            this.pluginStateManager.getSettings().profile =
                                value;
                            await this.pluginStateManager.updateSettings({
                                profile: value,
                            });
                            this.shouldEnableLocalCredentials();
                        })
                );
        } else {
            containerEl.createEl("p", {
                text: `No AWS profiles found in ${Config.AWS_CREDENTIALS_FILE_PATH}, falling back to Access Key ID and Secret Access Key.`,
            });
        }

        this.awsAccessKeySetting = new Setting(containerEl)
            .setName("AWS Access Key ID")
            .setDesc("The Access Key ID of your AWS IAM account")
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.accessKeyId ?? "")
                    .setValue(this.pluginStateManager.getSettings().accessKeyId)
                    .onChange(async (value) => {
                        const formatedValue = trimWhitespace(value);

                        this.pluginStateManager.getSettings().accessKeyId =
                            formatedValue;
                        await this.pluginStateManager.updateSettings({
                            accessKeyId: formatedValue,
                        });

                        text.setValue(formatedValue);
                    })
            );

        this.awsSecretAccessKeySetting = new Setting(containerEl)
            .setName("AWS Secret Access Key")
            .setDesc("The Secret Access Key of your AWS IAM account")
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.secretAccessKey ?? "")
                    .setValue(
                        this.pluginStateManager.getSettings().secretAccessKey
                    )
                    .onChange(async (value) => {
                        const formatedValue = trimWhitespace(value);

                        this.pluginStateManager.getSettings().secretAccessKey =
                            formatedValue;
                        await this.pluginStateManager.updateSettings({
                            secretAccessKey: formatedValue,
                        });

                        text.setValue(formatedValue);
                    })
            );

        this.shouldEnableLocalCredentials();

        // Cache Management Section
        new Setting(containerEl)
            .setName("Cache Management")
            .setDesc("Manage the plugin's cache and stored data")
            .setHeading();

        const clearCacheSetting = new Setting(containerEl)
            .setName("Clear All Caches")
            .setDesc(
                "Delete all cached files and localStorage entries. This action is safe - files can be re-downloaded when needed."
            )
            .addButton((button) =>
                button
                    .setButtonText("Clear All Caches")
                    .setCta()
                    .onClick(async () => {
                        await this.plugin.cacheManager.clearAllCaches();
                    })
            );

        clearCacheSetting.settingEl.addClass("mod-warning");
    }

    private shouldEnableLocalCredentials() {
        const isProfileSet =
            this.pluginStateManager.getSettings().profile !==
                Config.AWS_PROFILE_NAME_NONE &&
            this.pluginStateManager.getSettings().profile !== "";

        if (isProfileSet) {
            const accessKeyComponent = this.awsAccessKeySetting
                .components[0] as TextComponent;
            const secretKeyComponent = this.awsSecretAccessKeySetting
                .components[0] as TextComponent;

            accessKeyComponent.setValue("");
            secretKeyComponent.setValue("");
            this.awsAccessKeySetting.setDisabled(true);
            this.awsSecretAccessKeySetting.setDisabled(true);
        } else {
            this.awsAccessKeySetting.setDisabled(false);
            this.awsSecretAccessKeySetting.setDisabled(false);
        }
    }
}
