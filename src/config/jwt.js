import passportJWT from 'passport-jwt';
import mongoose from 'mongoose';
import config from './index.js';
import RefreshToken from '../models/schemas/RefreshToken';

const JwtStrategy = passportJWT.Strategy;

const User = mongoose.model('users');

const setJWTrules = async (passport) => {

    const parseCookies = (sourse) => {
        const list = {};
        const rc = sourse;

        rc && rc.split(';').forEach(function (cookie) {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });

        return list;
    };

    const getTokenFromCookie = (req) => {
        let token = null;
        const cookie = req.headers && req.headers.cookie;
        const cookieList = parseCookies(cookie);
        if (cookieList) {
            const rerToken = cookieList['token'];
            token = rerToken ? rerToken.split(config.tokenPrefix)[1].trim() : null;
        }

        return token;
    };

    const getRefTokenFromCookie = (req) => {
        let token = null;
        const cookie = req.headers && req.headers.cookie;
        const cookieList = parseCookies(cookie);
        if (cookieList) {
            const rerToken = cookieList['refreshToken'];
            token = rerToken ? rerToken.split(config.tokenPrefix)[1].trim() : null;
        }

        return token;
    };

    const opts = {};
    opts.jwtFromRequest = getTokenFromCookie;
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

    passport.use(
        'jwt-admin',
        new JwtStrategy(opts, (jwt_payload, done) => {
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

    const refOpts = {};
    refOpts.jwtFromRequest = getRefTokenFromCookie;
    refOpts.secretOrKey = config.secret;

    passport.use(
        'refresh',
        new JwtStrategy(refOpts, (jwt_payload, done) => {
            RefreshToken.findOne({userId: jwt_payload.id})
                .then(refToken => {
                    if (refToken) {
                        return done(null,
                            Object.assign({},
                                refToken,
                                jwt_payload,
                            ));
                    }
                    return done(null, false);
                })
                .catch(err => console.log(err));
        }),
    );
};

export default setJWTrules;