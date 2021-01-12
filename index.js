import express from 'express';
import mongoose from 'mongoose';
import os from 'os';
import { log } from './src/helpers/helper';
import config from './src/config';
import { initialImport } from './src/controllers/importController';

// do not delete this one import
// eslint-disable-next-line no-unused-vars
import models from './src/models/index';

import addMiddlewares from './src/middlewares';
import addRoutes from './src/routes';

const startServer = async () => {
  const app = express();
  addMiddlewares(app);
  addRoutes(app);

  app.listen(config.port, (err) => {
    if (err) {
      throw new Error(err.message);
    }

    log(`🛡  Server is listening: ${os.hostname()} 🏆  on port: ${config.port}`);
    log(`🛡  environment: ${config.environment}`);
  });
};

mongoose.connect(config.DB_string, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})
  .catch((error) => {
    log(`💥💥💥  Connection to MongoDB fail: ${error}`);
  });

mongoose.connection.once('open', async () => {
  log('🚀🚀🚀  Connected to MongoDB success');

  if (config.initial_import) {
    log('🚀🚀🚀  Initial data import performing ...');
    await initialImport('public/product.json');
  }

  await startServer();
});

mongoose.connection.on('reconnectFailed', () => {
  process.nextTick(() => {
    log('💥💥💥  Mongoose could not reconnect to MongoDB server');
  });
});

if (config.mongoDebugMode) {
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    log(`🥁 method: ${collectionName}.${method}`);
    log(`🎯 filters: ${JSON.stringify(query)}`);
    if (options) log(`🧩 query options: ${options}`);
    log(Array(100).join('_'));
  });
}

process.once('uncaughtException', (error) => {
  log(`💥💥💥 ${error.message}`);

  // force exit process anyway
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
