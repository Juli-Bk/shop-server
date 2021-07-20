import cors from 'cors';
import bodyParser from 'body-parser';
import passport from 'passport';
import config from './config/index';
import jwt from './auth/jwt';
import { log } from './helpers/helper';

const allowedByCors = (origin) => {
  // allows cors from only few addresses:
  const whitelist = [config.clientBaseAddress];
  return whitelist.indexOf(origin) !== -1 || (!config.blockRestTools && !origin);
};

const addMiddlewares = (app) => {
  if (config.allowCors) {
    app.use(cors({
      origin: (origin, callback) => {
        // allows cors from any Dynamic Origin (for development mode). not secure
        // localhost, postman, etc
        if (config.environment === 'development') {
          return callback(null, true);
        }

        if (allowedByCors(origin)) {
          callback(null, true);
        } else {
          const msg = `${origin}  💥 Not allowed by CORS`;
          log(msg);
          callback(new Error(msg));
        }
        return true;
      },

      optionsSuccessStatus: 200,
      credentials: true,
    }));
  }

  app.use(bodyParser.json());

  // parse application/x-www-form-urlencoded
  // app.use(bodyParser.urlencoded({ extended: false }))

  // for parsing multipart/form-data
  // app.use(upload.array());

  app.use(passport.initialize());
  jwt(passport);
};

export default addMiddlewares;
