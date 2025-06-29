import { Notice } from "obsidian";
import Config from "../config/config";

import { emitter, EVENT_UI_MESSAGE } from "../event/event";

export default class NotificationManager {
    private readonly moduleName = "notificationManager";

    constructor() {
        this.setupNotificationEventListener();
    }

    /**
     * Sets up the notification event listener.
     * @param message - The message to display
     * @param duration - Time in milliseconds to show the notice for. If this is 0, the notice will remain until dismissed. Default is 2000ms (2 seconds).
     */
    private setupNotificationEventListener() {
        emitter.on(EVENT_UI_MESSAGE, ({ message, duration = 2000 }) => {
            console.debug(`${this.moduleName} - ${message}`);
            new Notice(`${Config.PLUGIN_DISPLAY_NAME} - ${message}`, duration);
        });
    }
}
