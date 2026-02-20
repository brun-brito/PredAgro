type LogLevel = 'log' | 'warn' | 'error';

function write(level: LogLevel, message: string, details?: unknown) {
  const timestamp = new Date().toISOString();

  if (details) {
    console[level](`[${timestamp}] ${message}`, details);
    return;
  }

  console[level](`[${timestamp}] ${message}`);
}

export const logger = {
  info: (message: string, details?: unknown) => write('log', message, details),
  warn: (message: string, details?: unknown) => write('warn', message, details),
  error: (message: string, details?: unknown) => write('error', message, details),
};
