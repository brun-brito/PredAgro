function write(level, message, details) {
  const timestamp = new Date().toISOString();

  if (details) {
    console[level](`[${timestamp}] ${message}`, details);
    return;
  }

  console[level](`[${timestamp}] ${message}`);
}

const logger = {
  info: (message, details) => write('log', message, details),
  warn: (message, details) => write('warn', message, details),
  error: (message, details) => write('error', message, details),
};

module.exports = { logger };
