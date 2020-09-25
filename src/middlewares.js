import cors from 'cors';
import bodyParser from 'body-parser';
import passport from 'passport';
import config from '../src/config/index';
import jwt from './auth/jwt';
// import multer from 'multer';
// const upload = multer();

const addMiddlewares = (app) => {

    if (config.allowCors) {
        // allows cors from only few addresses:
        const whitelist = [config.baseAddress];

        app.use(cors({
            origin: function (origin, callback) {
                // allows cors from any Dynamic Origin (for development mode). not secure
                // localhost, postman, etc
                if (config.environment === 'development') {
                    return callback(null, true);
                } else if (origin && whitelist.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    console.log(origin, ' 💥 Not allowed by CORS');
                    callback(new Error('Not allowed by CORS'));
                }
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