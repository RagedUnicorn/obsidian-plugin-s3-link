import S3LinkPlugin from "../main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS, REGIONS } from "./settings";
import { AwsProfile } from "../aws/awsProfile";
import { Config } from "../config";
import { AwsCredentialProvider } from "../aws/awsCredentialProvider";

export class PluginSettingsTab extends PluginSettingTab {
    plugin: S3LinkPlugin;
    awsAccessKeySetting: Setting;
    awsSecretAccessKeySetting: Setting;

    constructor(app: App, plugin: S3LinkPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("S3 Bucket Name")
            .setDesc("The name of your S3 bucket")
            .addText((text) =>
                text
                    .setPlaceholder(
                        DEFAULT_SETTINGS.bucketName
                            ? DEFAULT_SETTINGS.bucketName
                            : ""
                    )
                    .setValue(this.plugin.settings.bucketName)
                    .onChange(async (value) => {
                        this.plugin.settings.bucketName = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("S3 Bucket Region")
            .setDesc("The region of your S3 bucket")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(REGIONS)
                    .setValue(this.plugin.settings.region)
                    .onChange(async (value) => {
                        this.plugin.settings.region = value;
                        await this.plugin.saveSettings();
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
                        .setValue(this.plugin.settings.profile)
                        .onChange(async (value) => {
                            this.plugin.settings.profile = value;
                            await this.plugin.saveSettings();
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
                    .setPlaceholder(
                        DEFAULT_SETTINGS.accessKeyId
                            ? DEFAULT_SETTINGS.accessKeyId
                            : ""
                    )
                    .setValue(this.plugin.settings.accessKeyId)
                    .onChange(async (value) => {
                        this.plugin.settings.accessKeyId = value;
                        await this.plugin.saveSettings();
                    })
            );

        this.awsSecretAccessKeySetting = new Setting(containerEl)
            .setName("AWS Secret Access Key")
            .setDesc("The Secret Access Key of your AWS IAM account")
            .addText((text) =>
                text
                    .setPlaceholder(
                        DEFAULT_SETTINGS.secretAccessKey
                            ? DEFAULT_SETTINGS.secretAccessKey
                            : ""
                    )
                    .setValue(this.plugin.settings.secretAccessKey)
                    .onChange(async (value) => {
                        this.plugin.settings.secretAccessKey = value;
                        await this.plugin.saveSettings();
                    })
            );

        this.shouldEnableLocalCredentials();
    }

    private shouldEnableLocalCredentials() {
        if (
            this.plugin.settings.profile === Config.AWS_PROFILE_NAME_NONE ||
            this.plugin.settings.profile === ""
        ) {
            this.awsAccessKeySetting.setDisabled(false);
            this.awsSecretAccessKeySetting.setDisabled(false);
        } else {
            this.awsAccessKeySetting.setDisabled(true);
            this.awsSecretAccessKeySetting.setDisabled(true);
        }
    }
}
