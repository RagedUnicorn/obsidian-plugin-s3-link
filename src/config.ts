export default abstract class Config {
    static readonly PLUGIN_NAME = "obsidian-plugin-s3-link";
    static readonly PLUGIN_DISPLAY_NAME = "S3 Link Plugin";
    static readonly CACHE_FOLDER = "s3_cache";
    static readonly S3_LINK_PREFIX = "s3";
    static readonly S3_LINK_SPLITTER = ":";
    static readonly AWS_CREDENTIALS_FILE_PATH = ".aws\\credentials";
    static readonly AWS_PROFILE_NAME_NONE = "None";
    static readonly S3_LINK_EXPIRATION_TIME_SECONDS = 60 * 60; // 1 hour
    static readonly S3_SIGNED_LINK_PREFIX = "s3-sign";
    static readonly S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS = 60 * 60 * 24 * 7; // 7 days
    static readonly OBSIDIAN_APP_LINK_PREFIX = "obsidian://open?file=";
}
