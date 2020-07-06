import cors from 'cors';
import bodyParser from 'body-parser';
import passport from 'passport';
import config from '../src/config/index';
import jwt from './config/jwt';
import multer from 'multer';
const upload = multer();

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

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))

    // for parsing multipart/form-data
    app.use(upload.array());

    app.use(passport.initialize());
    jwt(passport);
};

export default addMiddlewares;