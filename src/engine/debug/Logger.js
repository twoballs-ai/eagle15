// src/engine/debug/Logger.js

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LEVEL_COLORS = {
  DEBUG: '#888888',
  INFO: '#44aaff',
  WARN: '#ffaa44',
  ERROR: '#ff4444',
};

const LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
};

export class Logger {
  constructor(minLevel = LOG_LEVELS.INFO, maxHistory = 150) {
    this.minLevel = minLevel;
    this.history = [];
    this.maxHistory = maxHistory;
  }

  setLevel(level) {
    this.minLevel = level;
  }

  _log(level, module, message, ...args) {
    if (level < this.minLevel) return;

    const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    const levelName = LEVEL_NAMES[level];
    const color = LEVEL_COLORS[levelName];
    const prefix = `[${time}] [${levelName}] [${module}]`;

    // 1. Сохраняем в историю для внутриигрового оверлея (без аргументов, только текст)
    const argsStr = args.length > 0 ? ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') : '';
    this.history.push({ time, level: levelName, module, message: String(message) + argsStr });
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // 2. Выводим в консоль с цветным префиксом
    const consoleMethod = level === LOG_LEVELS.ERROR ? 'error' : level === LOG_LEVELS.WARN ? 'warn' : 'log';
    console[consoleMethod](`%c${prefix}%c ${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;', ...args);
  }

  debug(module, msg, ...args) { this._log(LOG_LEVELS.DEBUG, module, msg, ...args); }
  info(module, msg, ...args) { this._log(LOG_LEVELS.INFO, module, msg, ...args); }
  warn(module, msg, ...args) { this._log(LOG_LEVELS.WARN, module, msg, ...args); }
  error(module, msg, ...args) { this._log(LOG_LEVELS.ERROR, module, msg, ...args); }

  getHistory() {
    return this.history;
  }

  clear() {
    this.history = [];
  }
}

// Экспортируем готовый синглтон, но его уровень можно будет менять из Settings
export const logger = new Logger();