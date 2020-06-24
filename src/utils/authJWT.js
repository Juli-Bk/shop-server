import jwt from 'jsonwebtoken';
import config from '../config';
import moment from 'moment';

const signUp = ({email, login, password, firstName, lastName, _id}, fingerprint) => {
    const expiresTime = Math.floor(Date.now() / 1000) + (config.expiresInMinutes * 60);

    const exp = 10 * config.expiresInMinutes * 60 * 1000; // 10 hours in ms

    const sign = jwt.sign({
            email,
            login,
            password,
            firstName,
            lastName,
            id: _id,
            exp: expiresTime,
        },
        config.secret,
    );

    const signRefresh = jwt.sign({
        fingerprint,
        email,
        login,
        password,
        firstName,
        lastName,
        id: _id,
        exp: Number(moment().add(exp, 'ms')),
    }, config.secret);

    return {
        token: `${config.tokenPrefix}${sign}`,
        expiresInMinutes: config.expiresInMinutes,
        newRefreshToken: `${config.tokenPrefix}${signRefresh}`,
        expiresRTInMS: exp,
    };
};
export default signUp;