import passportJWT from 'passport-jwt';
import mongoose from 'mongoose';
import config from '../config';
import { log } from '../helpers/helper';

const prefix = config.tokenPrefix;

const JwtStrategy = passportJWT.Strategy;

const User = mongoose.model('users');

export const parseCookies = (source) => {
  const list = {};
  const rc = source;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }

  return list;
};

export const getTokenFromCookie = (req) => {
  let token = null;
  const cookie = req.headers && req.headers.cookie;
  if (cookie) {
    const cookieList = parseCookies(cookie);
    if (cookieList) {
      const refToken = cookieList.token;
      if (refToken) {
        token = refToken.split(prefix)[1]
          ? refToken.split(prefix)[1].trim()
          : null;
      }
    }
  }

  return token;
};

export const getRefreshTokenFromCookie = (req) => {
  let token = null;
  const cookie = req.headers && req.headers.cookie;
  if (cookie) {
    const cookieList = parseCookies(cookie);
    if (cookieList) {
      const refToken = cookieList.refreshToken;
      if (refToken) {
        token = refToken.split(prefix)[1]
          ? refToken.split(prefix)[1].trim()
          : null;
      }
    }
  }

  return token;
};

export const getToken = (req) => getTokenFromCookie(req) || getRefreshTokenFromCookie(req);
export const getTokenFromQuery = (req) => (req.query ? req.query.token : null);

const setJWTrules = async (passport) => {
  const opts = {};
  opts.jwtFromRequest = getToken;
  opts.secretOrKey = config.secret;

  passport.use(
    'jwt',
    new JwtStrategy(opts, (jwtPayload, done) => {
      User.findById(jwtPayload.id)
        .then((user) => done(null, user || false))
        .catch((err) => log(err));
    }),
  );

  const optsAdm = {};
  optsAdm.jwtFromRequest = getToken;
  optsAdm.secretOrKey = config.secret;

  passport.use(
    'jwt-admin',
    new JwtStrategy(optsAdm, (jwtPayload, done) => {
      User.findById(jwtPayload.id)
        .then((user) => {
          if (user && user.isAdmin) {
            return done(null, user);
          }

          return done(null, false, {
            message: 'You have not enough permissions for this operation',
          });
        })
        .catch((err) => log(err));
    }),
  );

  const recoverOpts = {};
  recoverOpts.jwtFromRequest = getTokenFromQuery;
  recoverOpts.secretOrKey = config.secret;

  passport.use(
    'recover',
    new JwtStrategy(recoverOpts, (jwtPayload, done) => {
      User.findOne({ email: jwtPayload.email })
        .then((user) => done(null, user || false))
        .catch((err) => log(err));
    }),
  );
};

export default setJWTrules;
