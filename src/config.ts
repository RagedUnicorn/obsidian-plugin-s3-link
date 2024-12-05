export default abstract class Config {
    static readonly PLUGIN_NAME = "obsidian-plugin-s3-link";
    static readonly PLUGIN_DISPLAY_NAME = "S3 Link Plugin";
    static readonly S3_LINK_SPLITTER = ":";
    static readonly S3_LINK_PLUGIN_DATA_ATTRIBUTE = "data-object-key";

    static readonly S3_PLUGIN_PROCESSED = "s3-plugin-processed";

    // aws
    static readonly AWS_CREDENTIALS_FILE_PATH = ".aws\\credentials";
    static readonly AWS_PROFILE_NAME_NONE = "None";

    // s3 file link
    static readonly S3_FILE_LINK_PREFIX = "s3";
    static readonly S3_FILE_LINK_DOWNLOAD_TIMEOUT = 120000; // 2 minutes
    static readonly S3_FILE_LINK_EXPIRATION_TIME_SECONDS = 60; // 1 minute
    static readonly S3_FILE_LINKS_CACHE_PATH = "s3FileLinks";
    static readonly S3_FILE_LINK_CACHE_FOLDER = "s3_link_cache";

    // s3 signed link
    static readonly S3_SIGNED_LINK_PREFIX = "s3-sign";
    static readonly S3_SIGNED_LINK_EXPIRATION_TIME_SECONDS = 60 * 60 * 24 * 7; // 7 days
    static readonly S3_SIGNED_LINKS_CACHE_PATH = "s3SignedLinks";
}
