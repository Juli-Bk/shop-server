import User from '../models/schemas/User';
import RefreshToken from '../models/schemas/RefreshToken';
import {log} from '../utils/helper';
import bcrypt from 'bcryptjs';
import signUpRecover from '../utils/authJWTRecover';
import signUp from '../utils/authJWT';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import {getRefTokenFromCookie, getTokenFromCookie} from '../config/jwt';
import {sendEmailAddressConfirmation, sendRecoveryPasswordLetter} from '../config/mailgun';
import validator from 'validator';
import config from '../config';

export const createUser = (req, res, next) => {
    const data = req.body;
    const {email, login, password} = data;

    if (!(email || login) || !password) {
        return res.status(400)
            .json({message: 'Email or login, password are required'});
    }

    User.findOne({
        $or: [
            {email: email},
            {login: login},
        ],
    })
        .then(customer => {
            if (customer) {
                if (customer.email === email) {
                    return res
                        .status(400)
                        .json({message: `Email ${customer.email} already exists`});
                }

                if (customer.login === login) {
                    return res
                        .status(400)
                        .json({message: `Login ${customer.login} already exists`});
                }
            }

            data.createdDate = moment.utc().format('MM-DD-YYYY');
            const newCustomer = new User({
                email: email.trim(),
                login: login.trim(),
                password: password.trim(),
            });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newCustomer.password, salt, (err, hash) => {

                    if (err) {
                        return res.status(400)
                            .json({message: `Error happened on server: ${err.message}`});
                    }

                    newCustomer.password = hash;
                    newCustomer.createdDate = Date.now();

                    newCustomer.save()
                        .then(customer => {
                            const {token, tokenExpiresInMS, newRefreshToken, refTokenExpiresInMS} = signUp(customer);

                            const expDate = new Date(moment().add(refTokenExpiresInMS, 'ms'));
                            const expDateShort = new Date(moment().add(tokenExpiresInMS, 'ms'));

                            return res.status(200)
                                .cookie('refreshToken', newRefreshToken, {
                                    expires: expDate,
                                    httpOnly: true,
                                    sameSite: 'None',
                                    secure: true,
                                })
                                .cookie('token', token, {
                                    expires: expDateShort,
                                    sameSite: 'None',
                                    secure: true,
                                })
                                .json({
                                    user: {
                                        _id: customer._id,
                                        email: customer.email,
                                        login: customer.login,
                                    },
                                    token: {
                                        token,
                                        expires: expDateShort,
                                    },
                                });
                        })
                        .catch(error => {
                                res.status(400).json({
                                    message: `Error happened on server: "${error.message}" `,
                                });
                                log(error);
                                next(error);
                            },
                        );
                });
            });
        })
        .catch(error => {
                res.status(400).json({
                    message: `Error happened on server: "${error.message}" `,
                });
                log(error);
                next(error);
            },
        );
};

export const getAllUsers = async (req, res, next) => {
    const perPage = Number(req.query.perPage);
    const startPage = Number(req.query.startPage);

    const sort = req.query.sort;

    const count = (await User.find()).length;

    User
        .find()
        .skip(startPage * perPage - perPage)
        .limit(perPage)
        .sort(sort)
        .then(users => {
            const usersData = users.map((user) => {
                //hiding user private data
                user.phone = 'XXXX-XXXX-' + user.phone.slice(8);
                user.email = 'XXXX-XXXX-' + user.email.split('@')[1];
                delete user.password;
                return user;
            });
            return res.status(200).send({usersData, totalCount: count});
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting products error: ${error}`,
                    });
                log(error);
                next(error);
            },
        );
};

export const getUser = (req, res, next) => {
    let tokenFromCookie = getTokenFromCookie(req);

    User.findById(req.user.id)
        .then(user => {
            if (!tokenFromCookie) {
                // means token is expired, but refToken is ok
                const {fingerprint, email, login, password, firstName, lastName, id} = user;

                const {token, tokenExpiresInMS} = signUp({
                    fingerprint,
                    email,
                    login,
                    password,
                    firstName,
                    lastName,
                    _id: id,
                }, fingerprint);

                return res.status(200)
                    .cookie('token', token, {
                        expires: new Date(moment().add(tokenExpiresInMS, 'ms')),
                        sameSite: 'None',
                        secure: true,
                    })
                    .json({
                        user,
                        token: {
                            token,
                            expires: new Date(moment().add(tokenExpiresInMS, 'ms')),
                        },
                    });
            } else {
                return res.status(200)
                    .json({user});
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `get user data error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const confirmEmail = (req, res, next) => {
    const email = req.query.email;
    if (!email || (email && !validator.isEmail(email))) {
        return res.status(400)
            .json({
                message: `incorrect email to confirm" `,
            });
    }
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.status(400)
                    .json({
                        message: `user with email: ${email} is not found`,
                    });
            }
            user.confirmedEmail = true;
            user.save()
                .then(() => {
                    return res.status(200).json({user});
                })
                .catch(error => {
                        res.status(400)
                            .json({
                                message: `confirmation email. save user data error: "${error.message}" `,
                            });
                        log(error);
                        next(error);
                    },
                );

        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `confirmation email. get user data error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const sendConfirmEmailLetter = (req, res) => {
    const email = req.query.email;

    sendEmailAddressConfirmation(email, (error) => {
        if (error) {
            return res.status(400)
                .json({message: error.message});
        } else {
            return res.status(200)
                .json({message: 'Please, check your email'});
        }
    });

};

export const sendRecovery = (req, res, next) => {
    const email = req.query.email;
    const fingerprint = req.query.fingerprint;
    const token = signUpRecover({email}, fingerprint);

    User.findOne({email: email})
      .then((user) => {
        if (user) {
          sendRecoveryPasswordLetter(email, token, (error) => {
            if (error) {
              return res.status(400).json({message: error.message});
          }   else {
              return res.status(200).json({message: 'Please, check your email'});
          }
        });
      } else {
          return res.status(200)
            .json({message: `User with email ${email} not found`});
      }
    }).catch(error => {
          res.status(400)
            .json({
              message: `find user by email error: "${error.message}"`,
           });
          log(error);
          next(error);
  })
};

export const recoverPassword = (req, res, next) => {
    const {newPassword, email} = req.body;

    if (!email) {
        return res.status(400)
            .json({message: 'To recover your password specify email address'});
    }
    if (!validator.isEmail(email)) {
        return res.status(400)
            .json({message: 'incorrect email for mailing'});
    }

    if (!newPassword) {
        return res.status(400)
            .json({message: 'empty password. rejection'});
    }

    User.findOne({email: email})
        .then((user) => {
            if (user) {
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newPassword, salt, (err, hash) => {

                        user.password = hash;
                        user.updatedDate = moment.utc().format('MM-DD-YYYY');
                        user.save()
                            .then(() => {
                                return res.status(200).json({
                                    message: `success recovery`,
                                });
                            })
                            .catch(error => {
                                    res.status(400)
                                        .json({
                                            message: `recovery password error: "${error.message}" `,
                                        });
                                    log(error);
                                    next(error);
                                },
                            );
                    });
                });

            } else {
                res.status(400)
                    .json({
                        message: `Rejection! User  with email is not found ${email}`,
                    });
            }

        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `recovery password error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const updateUserInfo = (req, res, next) => {

    const id = req.body.id || req.user.id;

    if (!id) {
        return res.status(400)
            .json({
                message: `update user data error. User id is required`,
            });
    }
    const filePath = req.file ? req.file.path : null;

    const data = {
        ...req.body,
        updatedDate: moment.utc().format('MM-DD-YYYY'),
        avatarUrl: filePath,
    };

    User.findByIdAndUpdate(id, {$set: data}, {new: true, runValidators: true})
        .then(user => {
            if (!user) {
                return res.status(400)
                    .json({message: `User with id "${id}" is not found.`});
            } else {
                res.status(200).json(user);
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `update user data error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const loginUser = (req, res, next) => {
    const data = req.body;
    const {login, password, fingerprint} = data;

    const {cookie} = req.headers;
    const oldRefToken = cookie && cookie.split('=').length ? cookie.split('=')[1] : null;

    if (!login || !password) {
        res.status(400)
            .json({message: 'Login and password are required'});
        return;
    }

    User.findOne({
        $or: [{email: login}, {login: login}],
    })
        .then(user => {
            if (!user) {
                res.status(400)
                    .json({
                        message: 'User is not found. Please check your login and password',
                    });
            }

            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        user.lastLoginDate = moment.utc();
                        user.save();

                        const {token, tokenExpiresInMS, newRefreshToken, refTokenExpiresInMS} = signUp(user, fingerprint);

                        const filters = oldRefToken ?
                            {$and: [{userId: user._id}, {token: oldRefToken}]}
                            : {userId: user._id};

                        const expDate = new Date(moment().add(refTokenExpiresInMS, 'ms'));
                        const expDateShort = new Date(moment().add(tokenExpiresInMS, 'ms'));

                        RefreshToken.findOne(filters)
                            .then(savedRT => {
                                if (savedRT) {
                                    if (new Date(savedRT.exp) > Date.now()) {
                                        // refToken is not expired. just return new plain token and old refresh token
                                        return res
                                            .status(200)
                                            .cookie('refreshToken', savedRT.token, {
                                                expires: new Date(savedRT.exp),
                                                httpOnly: true,
                                                sameSite: 'None',
                                                secure: true,
                                            })
                                            .cookie('token', token, {
                                                expires: expDateShort,
                                                sameSite: 'None',
                                                secure: true,
                                            })
                                            .json({
                                                user,
                                                token: {
                                                    token,
                                                    expires: expDateShort,
                                                },
                                            });
                                    } else {
                                        // refresh token is expired ->> delete old one from DB, save new one
                                        savedRT.remove()
                                            .then(() => {
                                                const rt = new RefreshToken({
                                                    token: newRefreshToken,
                                                    // save exp dateTime in ms in DB
                                                    exp: Number(moment().add(refTokenExpiresInMS, 'ms')),
                                                    userId: user._id,
                                                    createdDate: moment.utc().format('MM-DD-YYYY'),
                                                });
                                                rt.save()
                                                    .then(() => {
                                                        return res
                                                            .status(200)
                                                            .cookie('refreshToken', newRefreshToken, {
                                                                expires: expDate,
                                                                httpOnly: true,
                                                                sameSite: 'None',
                                                                secure: true,
                                                            })
                                                            .cookie('token', token, {
                                                                expires: expDateShort,
                                                                sameSite: 'None',
                                                                secure: true,
                                                            })
                                                            .json({
                                                                user,
                                                                token: {
                                                                    token,
                                                                    expires: expDateShort,
                                                                },
                                                            });
                                                    })
                                                    .catch(error => {
                                                        res.status(400)
                                                            .json({
                                                                message: `Login process error: "${error.message}" `,
                                                            });
                                                        log(error);
                                                        next(error);
                                                    });
                                            })
                                            .catch(error => {
                                                    res.status(400)
                                                        .json({
                                                            message: `Login process error: "${error.message}" `,
                                                        });
                                                    log(error);
                                                    next(error);
                                                },
                                            );
                                    }
                                } else {
                                    // first commit no refresh token yet ->> create new RT in DB
                                    const rt = new RefreshToken({
                                        token: newRefreshToken,
                                        // save exp dateTime in ms in DB
                                        exp: Number(moment().add(refTokenExpiresInMS, 'ms')),
                                        userId: user._id,
                                        createdDate: moment.utc().format('MM-DD-YYYY'),
                                    });
                                    rt.save()
                                        .then(() => {
                                            return res
                                                .status(200)
                                                .cookie('refreshToken', newRefreshToken, {
                                                    expires: expDate,
                                                    httpOnly: true,
                                                    sameSite: 'None',
                                                    secure: true,
                                                })
                                                .cookie('token', token, {
                                                    expires: expDateShort,
                                                    sameSite: 'None',
                                                    secure: true,
                                                })
                                                .json({
                                                    user,
                                                    token: {
                                                        token,
                                                        expires: expDateShort,
                                                    },
                                                });
                                        })
                                        .catch(error => {
                                                res.status(400)
                                                    .json({
                                                        message: `Login process error: "${error.message}" `,
                                                    });
                                                log(error);
                                                next(error);
                                            },
                                        );
                                }
                            })
                            .catch(error => {
                                    res.status(400)
                                        .json({
                                            message: `Login process error: "${error.message}" `,
                                        });
                                    log(error);
                                    next(error);
                                },
                            );
                    } else {
                        res.status(400)
                            .json({
                                message: 'Password doesnt match',
                            });
                    }
                });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Login process error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const refreshToken = (req, res, next) => {
    const prefix = config.tokenPrefix;
    const refToken = getRefTokenFromCookie(req);
    if (!refToken) {
        return res.status(200)
            .json({
                success: false,
                message: 'Refresh token is invalid. Please login again',
            });
    }

    jwt.verify(refToken, config.secret, (err, data) => {
        console.log('refToken data: ', data);
        if (err) {
            RefreshToken.findOne({token: refToken})
                .then((t) => {
                    if (t) {
                        t.remove()
                            .then(() => {
                                console.log('refToken is successfully  removed from db');
                            })
                            .catch(error => {
                                res.status(400)
                                    .json({
                                        message: `Refresh token delete error: "${error.message}" `,
                                    });
                                log(error);
                                next(error);
                            });
                    }
                    return res.status(200)
                        .json({
                            success: false,
                            message: 'Refresh token is invalid. Please login again',
                        });

                })
                .catch(error => {
                    res.status(400)
                        .json({
                            success: false,
                            message: `Refresh token delete error: "${error.message}" `,
                        });
                    log(error);
                    next(error);
                });
        } else if (Date.now() > data.exp) {
            return res.status(200)
                .json({
                    success: false,
                    message: 'Refresh token is expired. Please login again',
                });
        } else {
            RefreshToken.findOne({token: prefix + refToken})
                .then(refToken => {
                    if (refToken) {

                        const {fingerprint, email, login, password, firstName, lastName, id} = refToken.userId;

                        const {token, tokenExpiresInMS} = signUp({
                            fingerprint,
                            email,
                            login,
                            password,
                            firstName,
                            lastName,
                            _id: id,
                        }, fingerprint);

                        return res
                            .status(200)
                            .cookie('token', token, {
                                expires: new Date(moment().add(tokenExpiresInMS, 'ms')),
                                sameSite: 'None',
                                secure: true,
                            })
                            .json({
                                success: true,
                                user: refToken.user,
                                token: {
                                    token,
                                    expires: new Date(moment().add(tokenExpiresInMS, 'ms')),
                                },
                            });
                    } else {
                        return res.status(200)
                            .json({
                                success: false,
                                message: 'Refresh token is invalid. Please login again',
                            });

                    }
                })
                .catch(error => {
                    res.status(400)
                        .json({
                            success: false,
                            message: `Refresh token error: "${error.message}" `,
                        });
                    log(error);
                    next(error);
                });
        }
    });
};

export const logout = (req, res) => {
    const rerToken = getRefTokenFromCookie(req);
    const token = getTokenFromCookie(req);
    if (rerToken || token) {

        RefreshToken.findOne({token: rerToken})
            .then(savedRT => {
                if (savedRT) {
                    savedRT.remove()
                        .then(() => log('ref token is removed from DB'))
                        .catch(error => {
                            res.status(400)
                                .json({
                                    message: `Logout error: "${error.message}" `,
                                });
                            log(error);
                        });
                }
            })
            .catch(error => {
                res.status(400)
                    .json({
                        message: `Logout error: "${error.message}" `,
                    });
                log(error);
            });


        const expSoon = new Date(moment().add(10, 'ms'));
        return res
            .status(200)
            .cookie('refreshToken', rerToken, {
                expires: expSoon,
                httpOnly: true,
                sameSite: 'None',
                secure: true,
            })
            .cookie('token', token, {
                expires: expSoon,
                sameSite: 'None',
                secure: true,
            })
            .json({
                message: 'success',
            });

    } else {
        return res
            .status(200)
            .json({
                message: 'success',
            });
    }
};

export const updatePassword = (req, res, next) => {
    const data = req.body;
    let {oldPassword, newPassword, id} = data;

    if (!oldPassword || !newPassword) {
        res.status(400)
            .json({message: 'newPassword, oldPassword are required'});
        return;
    }

    User.findById(id)
        .then(user => {
            if (!user) {
                res.status(400)
                    .json({
                        message: 'User is not found',
                    });
                return;
            }

            user.comparePassword(oldPassword, function (err, isMatch) {
                if (!isMatch) {
                    res.status(400)
                        .json({
                            message: 'old password doesnt match',
                        });
                } else {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newPassword, salt, (err, hash) => {
                            if (err) throw err;
                            newPassword = hash;

                            user.password = newPassword;
                            user.updatedDate = moment.utc().format('MM-DD-YYYY');
                            user.save()
                                .then(user => {
                                    res.status(200).json({
                                        message: 'Password successfully changed',
                                        customer: user,
                                    });
                                })
                                .catch(error => {
                                        res.status(400)
                                            .json({
                                                message: `Update password error: "${error.message}"`,
                                            });
                                        log(error);
                                        next(error);
                                    },
                                );
                        });
                    });
                }
            });

        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Update password error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteUserById = (req, res, next) => {
    User.findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(200)
                .json({
                    message: `User with id "${req.params.id}" is deleted`,
                });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete user data error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteAllUsers = (req, res, next) => {

    User.deleteMany({isAdmin: false})
        .then(() => res.status(200)
            .json({
                message: 'all users except admins are deleted',
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete users error "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};