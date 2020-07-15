import passportJWT from 'passport-jwt';
import mongoose from 'mongoose';
import config from './index.js';
import RefreshToken from '../models/schemas/RefreshToken';

const prefix = config.tokenPrefix;

const JwtStrategy = passportJWT.Strategy;

const User = mongoose.model('users');

export const parseCookies = (sourse) => {
    const list = {};
    const rc = sourse;

    rc && rc.split(';').forEach(function (cookie) {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
};

export const getTokenFromAuth = (req) => {
    const {authorization = ''} = req.headers || {};
    let token = null;
    const authPartsArr = authorization.split(prefix);
    token = authPartsArr.length > 0
        ? authPartsArr[1]
            ? authPartsArr[1].trim()
            : null
        : null;
    return token;
};

export const getTokenFromCookie = (req) => {
    let token = null;
    const cookie = req.headers && req.headers.cookie;
    const cookieList = parseCookies(cookie);
    if (cookieList) {
        const rerToken = cookieList['token'];
        token = rerToken
            ? rerToken.split(prefix)[1]
                ? rerToken.split(prefix)[1].trim()
                : null
            : null;
    }

    return token;
};

export const getRefTokenFromCookie = (req) => {
    let token = null;
    const cookie = req.headers && req.headers.cookie;
    const cookieList = parseCookies(cookie);
    if (cookieList) {
        const rerToken = cookieList['refreshToken'];
        token = rerToken
            ? rerToken.split(prefix)[1]
                ? rerToken.split(prefix)[1].trim()
                : null
            : null;
    }

    return token;
};

export const getTokenFromQuery = (req) => {
    return req.query ? req.query.token : null;
};

const getToken = (req) => {
    const token = getTokenFromCookie(req) || getRefTokenFromCookie(req);
    return token;
};

const setJWTrules = async (passport) => {

    const opts = {};
    opts.jwtFromRequest = getToken;
    opts.secretOrKey = config.secret;

    passport.use(
        'jwt',
        new JwtStrategy(opts, (jwt_payload, done) => {
            User.findById(jwt_payload.id)
                .then(user => {
                    if (user) {
                        return done(null, user);
                    }
                    return done(null, false);
                })
                .catch(err => console.log(err));
        }),
    );

    const optsAdm = {};
    optsAdm.jwtFromRequest = getTokenFromAuth;
    optsAdm.secretOrKey = config.secret;

    passport.use(
        'jwt-admin',
        new JwtStrategy(optsAdm, (jwt_payload, done) => {
            User.findById(jwt_payload.id)
                .then(user => {
                    if (user && user.isAdmin) {
                        return done(null, user);
                    }
                    return done(null, false, {
                        message: 'You have not enough permissions for this operation',
                    });
                })
                .catch(err => console.log(err));
        }),
    );

    const recoverOpts = {};
    recoverOpts.jwtFromRequest = getTokenFromQuery;
    recoverOpts.secretOrKey = config.secret;

    passport.use(
        'recover',
        new JwtStrategy(recoverOpts, (jwt_payload, done) => {
            User.findOne({email: jwt_payload.email})
                .then(user => {
                    if (user) {
                        return done(null, user);
                    }
                    return done(null, false);
                })
                .catch(err => console.log(err));
        }),
    );
};

export default setJWTrules;