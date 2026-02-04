const express = require('express');
const cors = require('cors');
const { config } = require('./config/env');
const { apiRoutes } = require('./routes');
const { requestLogger } = require('./middlewares/requestLogger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
