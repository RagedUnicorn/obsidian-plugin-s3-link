import { Notice } from "obsidian";
import Config from "./config";

/**
 * Send a notification to the user
 *
 * @param message the message to send to the user
 */
export function sendNotification(message: string): void {
    new Notice(`${Config.PLUGIN_DISPLAY_NAME} - ${message}`);
}
