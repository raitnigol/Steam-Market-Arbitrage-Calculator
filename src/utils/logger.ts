type LogLevel = 'info' | 'debug' | 'warning' | 'error';

interface LogFunction {
  (message: string, level?: LogLevel): void;
  i(message: string): void;
  d(message: string): void;
  w(message: string): void;
  e(message: string): void;
}

const PREFIX = '[Steam Market Arbitrage]';

const createLogFunction = (logFn: typeof console.log): LogFunction => {
  const logWithLevel = (message: string, level: LogLevel = 'info'): void => {
    const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : level === 'debug' ? '🔍' : 'ℹ️';
    logFn(`${PREFIX} ${prefix} ${message}`);
  };

  const logger = ((message: string, level?: LogLevel) => logWithLevel(message, level)) as LogFunction;
  logger.i = (message: string) => logWithLevel(message, 'info');
  logger.d = (message: string) => logWithLevel(message, 'debug');
  logger.w = (message: string) => logWithLevel(message, 'warning');
  logger.e = (message: string) => logWithLevel(message, 'error');

  return logger;
};

export const log = createLogFunction(console.log);
export const error = createLogFunction(console.error);
export const warn = createLogFunction(console.warn);
export const debug = createLogFunction((...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(...args);
  }
});

export type Logger = {
  log: LogFunction;
  error: LogFunction;
  warn: LogFunction;
  debug: LogFunction;
};

export default {
  log,
  error,
  warn,
  debug
} as Logger; 