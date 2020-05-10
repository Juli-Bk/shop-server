import jwt from "jsonwebtoken";
import config from "../config";

const signUp = ({email, login, password, firstName, lastName, _id}) => {
    const sign = jwt.sign({
            email, login, password, firstName, lastName, id: _id,
            exp: Math.floor(Date.now() / 1000) + (config.expiresInMinutes * 60)
        },
        config.secret
    );

    return `${config.tokenPrefix} ${sign}`;
};
export default signUp;