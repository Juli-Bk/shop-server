import jwt from 'jsonwebtoken';
import config from '../config';
import moment from 'moment';

const signUp = ({email}, fingerprint) => {

    const dateExpiresTime = 15 * 60 * 1000; // 15 minutes

    return jwt.sign({
            email,
            fingerprint,
            exp: Number(moment().add(dateExpiresTime, 'ms')),
        },
        config.secret,
    )
};

export default signUp;