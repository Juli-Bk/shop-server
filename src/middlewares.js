import cors from 'cors';
import bodyParser from 'body-parser';
import passport from 'passport';
import config from '../src/config/index';
import jwt from './config/jwt';

const addMiddlewares = (app) => {
    if (config.allowCors) {
        app.use(cors({
            origin: function(origin, callback){
                return callback(null, true);
            },
            optionsSuccessStatus: 200,
            credentials: true
        }));
    }
    app.use(bodyParser.json());
    app.use(passport.initialize());
    jwt(passport);
};

export default addMiddlewares;