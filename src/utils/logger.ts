
const isDev = import.meta.env.DEV;

export const logger = {
    info: (message: string, ...args: any[]) => {
        if (isDev) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: any[]) => {
        if (isDev) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },
    error: (message: string, ...args: any[]) => {
        // We log errors even in production, but we should sanitize them
        if (isDev) {
            console.error(`[ERROR] ${message}`, ...args);
        } else {
            // Sanitize message to remove potential URLs or sensitive data
            const sanitizedMessage = message.replace(/https?:\/\/[^\s]+/g, '[URL]');
            console.error(`[ERROR] ${sanitizedMessage}`);
        }
    },
    debug: (message: string, ...args: any[]) => {
        if (isDev) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
};

export default logger;
