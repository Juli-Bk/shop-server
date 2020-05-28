import jwt from 'jsonwebtoken';
import config from '../config';

const signUp = ({email, login, password, firstName, lastName, _id}) => {
    const expiresTime = Math.floor(Date.now() / 1000) + (config.expiresInMinutes * 60);

    const sign = jwt.sign({
            email,
            login,
            password,
            firstName,
            lastName,
            id: _id,
            exp: expiresTime
        },
        config.secret
    );

    return {
        token: `${config.tokenPrefix} ${sign}`,
        expiresTime: expiresTime
    }
};
export default signUp;