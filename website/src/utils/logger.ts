export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}

export interface LogContext {
    [key: string]: any;
}

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    context?: LogContext;
    error?: Error;
    stackTrace?: string;
}

export interface LoggerConfig {
    level: LogLevel;
    includeTimestamp: boolean;
    includeStackTrace: boolean;
    enableConsole: boolean;
}

export class Logger {
    private config: LoggerConfig;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            level: LogLevel.INFO,
            includeTimestamp: true,
            includeStackTrace: true,
            enableConsole: true,
            ...config
        };
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.config.level;
    }

    private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
        const entry: LogEntry = {
            timestamp: this.config.includeTimestamp ? new Date().toISOString() : '',
            level: LogLevel[level],
            message,
            context
        };

        if (error && this.config.includeStackTrace) {
            entry.error = error;
            entry.stackTrace = error.stack;
        }

        return entry;
    }

    private writeToConsole(entry: LogEntry): void {
        if (!this.config.enableConsole) return;

        const prefix = entry.timestamp ? `[${entry.timestamp}] ${entry.level}:` : `${entry.level}:`;
        const message = `${prefix} ${entry.message}`;

        switch (entry.level) {
            case 'DEBUG':
                console.debug(message, entry.context, entry.stackTrace);
                break;
            case 'INFO':
                console.info(message, entry.context);
                break;
            case 'WARN':
                console.warn(message, entry.context);
                break;
            case 'ERROR':
            case 'FATAL':
                console.error(message, entry.context, entry.stackTrace);
                break;
        }
    }

    debug(message: string, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.DEBUG)) return;
        const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
        this.writeToConsole(entry);
    }

    info(message: string, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.INFO)) return;
        const entry = this.formatLogEntry(LogLevel.INFO, message, context);
        this.writeToConsole(entry);
    }

    warn(message: string, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.WARN)) return;
        const entry = this.formatLogEntry(LogLevel.WARN, message, context);
        this.writeToConsole(entry);
    }

    error(message: string, error?: Error, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.ERROR)) return;
        const entry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
        this.writeToConsole(entry);
    }

    fatal(message: string, error?: Error, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.FATAL)) return;
        const entry = this.formatLogEntry(LogLevel.FATAL, message, context, error);
        this.writeToConsole(entry);
    }

    // Convenience method for logging API requests
    logApiRequest(method: string, url: string, context?: LogContext): void {
        this.info(`API Request: ${method} ${url}`, {
            method,
            url,
            ...context
        });
    }

    // Convenience method for logging API responses
    logApiResponse(method: string, url: string, status: number, duration?: number, context?: LogContext): void {
        const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
        const message = `API Response: ${method} ${url} - ${status}${duration ? ` (${duration}ms)` : ''}`;

        if (level === LogLevel.ERROR) {
            this.error(message, undefined, { method, url, status, duration, ...context });
        } else {
            this.debug(message, { method, url, status, duration, ...context });
        }
    }
}

// Create a default logger instance
export const logger = new Logger({
    level: LogLevel.INFO, // Default to INFO level, can be configured per environment
    includeTimestamp: true,
    includeStackTrace: true,
    enableConsole: true
});