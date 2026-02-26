/**
 * Logger utility — structured logging with levels.
 * In production, replace with winston/pino.
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'debug'];

function formatMsg(level, module, message, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] [${module}] ${message}${metaStr}`;
}

function createLogger(module) {
  return {
    debug: (msg, meta) => {
      if (CURRENT_LEVEL <= LOG_LEVELS.debug) console.log(formatMsg('debug', module, msg, meta));
    },
    info: (msg, meta) => {
      if (CURRENT_LEVEL <= LOG_LEVELS.info) console.log(formatMsg('info', module, msg, meta));
    },
    warn: (msg, meta) => {
      if (CURRENT_LEVEL <= LOG_LEVELS.warn) console.warn(formatMsg('warn', module, msg, meta));
    },
    error: (msg, meta) => {
      if (CURRENT_LEVEL <= LOG_LEVELS.error) console.error(formatMsg('error', module, msg, meta));
    },
  };
}

module.exports = { createLogger };
