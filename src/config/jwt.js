import passportJWT from 'passport-jwt';
import mongoose from 'mongoose';
import config from './index.js';
import RefreshToken from '../models/schemas/RefreshToken';

const JwtStrategy = passportJWT.Strategy;

const User = mongoose.model('users');

const setJWTrules = async (passport) => {

    const getTokenFromAuthHeader = (request) => {
        let token = null;
        if (request && request.headers) {
            const authHeader = request.headers.authorization;
            if (authHeader) {
                const tokenParts = authHeader.split(config.tokenPrefix);
                token = tokenParts && tokenParts.length ? tokenParts[1] : null;
            }
        }
        return token;
    };

    const getTokenFromCookie = (req) => {
        let token = null;
        if (req && req.headers) {
            const cookie = req.headers.cookie;
            if (cookie) {
                const tokenParts = cookie.split(config.tokenPrefix);
                token = tokenParts && tokenParts.length ? tokenParts[1] : null;
            }
        }
        return token;
    };

    const opts = {};
    opts.jwtFromRequest = getTokenFromAuthHeader;
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
    refOpts.jwtFromRequest = getTokenFromCookie;
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