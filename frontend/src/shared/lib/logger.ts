type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private static instance: Logger;
  private entries: LogEntry[] = [];
  private maxEntries = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    const prefix = `[RoyaltyFlow][${level.toUpperCase()}]`;
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    
    if (process.env.NODE_ENV === 'development' || level === 'error') {
      console[consoleMethod](prefix, message, data || '');
    }
  }

  debug(message: string, data?: unknown) { this.log('debug', message, data); }
  info(message: string, data?: unknown) { this.log('info', message, data); }
  warn(message: string, data?: unknown) { this.log('warn', message, data); }
  error(message: string, data?: unknown) { this.log('error', message, data); }

  getEntries(level?: LogLevel): LogEntry[] {
    if (level) return this.entries.filter(e => e.level === level);
    return [...this.entries];
  }

  clear() { this.entries = []; }
}

export const logger = Logger.getInstance();
