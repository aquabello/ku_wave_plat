type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: number = LEVELS.info;

  setLevel(level: LogLevel): void {
    this.level = LEVELS[level] ?? LEVELS.info;
  }

  debug(msg: string): void {
    if (this.level <= LEVELS.debug) {
      console.log(`[${this.timestamp()}] [DEBUG] ${msg}`);
    }
  }

  info(msg: string): void {
    if (this.level <= LEVELS.info) {
      console.log(`[${this.timestamp()}] [INFO]  ${msg}`);
    }
  }

  warn(msg: string): void {
    if (this.level <= LEVELS.warn) {
      console.warn(`[${this.timestamp()}] [WARN]  ${msg}`);
    }
  }

  error(msg: string): void {
    if (this.level <= LEVELS.error) {
      console.error(`[${this.timestamp()}] [ERROR] ${msg}`);
    }
  }

  private timestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }
}

export const logger = new Logger();
