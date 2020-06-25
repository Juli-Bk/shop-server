import User from '../models/schemas/User';
import RefreshToken from '../models/schemas/RefreshToken';
import {log} from '../utils/helper';
import bcrypt from 'bcryptjs';
import signUp from '../utils/authJWT';
import moment from 'moment';

export const createUser = (req, res, next) => {
    const data = req.body;
    const {email, login, password} = data;

    if (!(email || login) || !password) {
        res.status(400)
            .json({message: 'Email or login, password are required'});
        return;
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
                        res.status(400)
                            .json({message: `Error happened on server: ${err.message}`});
                        return;
                    }

                    newCustomer.password = hash;
                    newCustomer.createdDate = Date.now();

                    newCustomer.save()
                        .then(customer => {
                            return res.status(200).json({
                                id: customer._id,
                                email: customer.email,
                                login: customer.login,
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
    User.findById(req.user.id)
        .then(user => {
            return res.status(200).json({user});
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

export const updateUserInfo = (req, res, next) => {

    const id = req.body.id;
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

                        const {token, expiresInMinutes, newRefreshToken, expiresRTInMS} = signUp(user, fingerprint);

                        const filters = oldRefToken ?
                            {
                                $and: [{userId: user._id}, {token: oldRefToken}],
                            }
                            : {userId: user._id};

                        RefreshToken.findOne(filters)
                            .then(savedRT => {
                                if (savedRT) {
                                    if (new Date(savedRT.exp) > Date.now()) {
                                        // is norm. just return new plain token and old refresh token
                                        return res
                                            .status(200)
                                            .cookie('refreshToken', savedRT.token, {
                                                maxAge: savedRT.exp,
                                                httpOnly: true,
                                            })
                                            .json({
                                                user,
                                                token: {
                                                    token,
                                                    expiresInMinutes,
                                                },
                                            });
                                    } else {
                                        // refresh token is expired ->> delete old one from DB, save new one
                                        savedRT.remove()
                                            .then(() => {
                                                const rt = new RefreshToken({
                                                    token: newRefreshToken,
                                                    exp: moment().add(expiresRTInMS, 'ms'),
                                                    userId: user._id,
                                                    createdDate: moment.utc().format('MM-DD-YYYY'),
                                                });
                                                rt.save()
                                                    .then(() => {
                                                        return res
                                                            .status(200)
                                                            .cookie('refreshToken', newRefreshToken, {
                                                                maxAge: expiresRTInMS,
                                                                httpOnly: true,
                                                            })
                                                            .json({
                                                                user,
                                                                token: {
                                                                    token,
                                                                    expiresInMinutes,
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
                                        exp: moment().add(expiresRTInMS, 'ms'),
                                        userId: user._id,
                                        createdDate: moment.utc().format('MM-DD-YYYY'),
                                    });
                                    rt.save()
                                        .then(() => {
                                            return res
                                                .status(200)
                                                .cookie('refreshToken', newRefreshToken, {
                                                    maxAge: expiresRTInMS,
                                                    httpOnly: true,
                                                })
                                                .json({
                                                    user,
                                                    token: {
                                                        token,
                                                        expiresInMinutes,
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
    const refToken = req.user && req.user._doc.token;
    const expDate = req.user && req.user._doc.exp;

    if (!refToken) {
        res.status(400)
            .json({message: 'Refresh token is invalid. Please login again'});
        return;
    }

    try {
        const {fingerprint, email, login, password, firstName, lastName, id} = req.user;

        const {token, expiresInMinutes} = signUp({
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
            .cookie('refreshToken', refToken, {maxAge: expDate, httpOnly: true})
            .json({
                token,
                expiresInMinutes,
            });
    } catch (error) {
        log(error);
        next(error);
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