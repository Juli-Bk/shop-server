import cors from "cors";
import bodyParser from "body-parser";
import config from "../src/config/index";

const addMiddlewares = (app) => {
    if (config.allowCors) {
        app.use(cors());
    }

    app.use(bodyParser.json());
};

export default addMiddlewares;