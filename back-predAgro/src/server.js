const { app } = require('./app');
const { config } = require('./config/env');
const { logger } = require('./utils/logger');

app.listen(config.port, () => {
  logger.info(`API online na porta ${config.port}`);
});
