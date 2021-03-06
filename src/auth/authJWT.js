import jwt from 'jsonwebtoken';
import moment from 'moment';
import config from '../config';

const signUp = ({
  email, login, password, firstName, lastName, _id,
}, fingerprint = 'some data') => {
  const dateExpiresTime = 1 * config.expiresInMinutes * 60 * 1000; // 1 hour in ms

  const dateExpiresTimeLong = 10 * config.expiresInMinutes * 60 * 1000; // 10 hours in ms

  const sign = jwt.sign({
    email,
    login,
    password,
    firstName,
    lastName,
    id: _id,
    exp: Number(moment().add(dateExpiresTime, 'ms')),
  },
  config.secret);

  const signRefresh = jwt.sign({
    fingerprint,
    email,
    login,
    password,
    firstName,
    lastName,
    id: _id,
    exp: Number(moment().add(dateExpiresTimeLong, 'ms')),
  }, config.secret);

  return {
    token: `${config.tokenPrefix}${sign}`,
    tokenExpiresInMS: dateExpiresTime,
    newRefreshToken: `${config.tokenPrefix}${signRefresh}`,
    refTokenExpiresInMS: dateExpiresTimeLong,
  };
};

export default signUp;
