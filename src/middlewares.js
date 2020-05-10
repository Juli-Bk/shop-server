import cors from "cors";
import bodyParser from "body-parser";
import passport from "passport";
import config from "../src/config/index";
import jwt from "./config/jwt";

const addMiddlewares = (app) => {
    if (config.allowCors) {
        app.use(cors());
    }

    app.use(bodyParser.json());
    app.use(passport.initialize());
    jwt(passport);
};

export default addMiddlewares;