import express from 'express';
import mongoose from "mongoose";
import {log} from "./src/utils/helper";
import config from './src/config';
import os from 'os';
import models from "./src/models/index";

import addMiddlewares from "./src/middlewares";
import addRoutes from "./src/routes";

export const startServer = async () => {
    const app = express();
    addMiddlewares(app);
    addRoutes(app);

    app.listen(config.port, err => {
        if (err) {
            process.exit(1);
            return;
        }

        app.get('/', (request, response, next) => {
            try {
                response
                    .status(201)
                    .json({
                        message: 'server response!!!'
                    });
            } catch (e) {
                console.log(e);
                next(e);
            }
        });

        log(`🛡  Server is listening: ${os.hostname()} 🏆  on port: ${config.port}`);
        log(`🛡  environment: ${config.environment}`);
    });
};

mongoose
    .connect(config.DB_string, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
    .catch(error => {
        log(`💥💥💥  Connection to MongoDB fail: ${error}`);
    });

mongoose.connection.once('open', () => {
    log('🚀🚀🚀  Connected to MongoDB success');
    startServer();
});

mongoose.connection.on('reconnectFailed', () => {
    process.nextTick(() => {
        log('💥💥💥  Mongoose could not reconnect to MongoDB server');
    });
});

if (config.environment === "development") {
    mongoose.set('debug', (collectionName, method, query, doc, options) => {
        console.log(`${collectionName}.${method}`, JSON.stringify(query), doc, options);
    });
}

process.once("uncaughtExeption", (error) => {
    console.log(error);

    //force exit process anyway
    process.exit(1);
});
