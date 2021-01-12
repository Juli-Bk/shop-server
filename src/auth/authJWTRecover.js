import jwt from 'jsonwebtoken';
import moment from 'moment';
import config from '../config';

const signUp = ({ email }, fingerprint) => {
  const dateExpiresTime = 15 * 60 * 1000; // 15 minutes

  return jwt.sign({
    email,
    fingerprint,
    exp: Number(moment().add(dateExpiresTime, 'ms')),
  },
  config.secret);
};

export default signUp;
