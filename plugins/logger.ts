type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    };

    return JSON.stringify(entry);
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage("info", message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage("warn", message, data));
  }

  error(message: string, data?: any) {
    console.error(this.formatMessage("error", message, data));
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, data));
    }
  }
}

export const logger = new Logger();

