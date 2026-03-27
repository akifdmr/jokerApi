// src/core/Logger.ts

export class Logger {
  static timestamp() {
    return new Date().toISOString();
  }

  static info(msg: string, ...args: any[]) {
    console.log(`\x1b[36m[INFO ${this.timestamp()}]\x1b[0m ${msg}`, ...args);
  }

  static warn(msg: string, ...args: any[]) {
    console.warn(`\x1b[33m[WARN ${this.timestamp()}]\x1b[0m ${msg}`, ...args);
  }

  static error(msg: string, ...args: any[]) {
    console.error(`\x1b[31m[ERROR ${this.timestamp()}]\x1b[0m ${msg}`, ...args);
  }

  static success(msg: string, ...args: any[]) {
    console.log(`\x1b[32m[SUCCESS ${this.timestamp()}]\x1b[0m ${msg}`, ...args);
  }
}
