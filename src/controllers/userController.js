import bcrypt from 'bcryptjs';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { promisify } from 'util';
import User from '../models/schemas/User';
import RefreshToken from '../models/schemas/RefreshToken';
import { log, getFormattedCurrentUTCDate } from '../helpers/helper';
import signUpRecover from '../auth/authJWTRecover';
import signUp from '../auth/authJWT';
import { getTokenFromCookie, getRefreshTokenFromCookie } from '../auth/jwt';
import { sendEmailAddressConfirmation, sendRecoveryPasswordLetter } from '../mailing/mailgun';
import config from '../config';
import { validateObjectId } from '../helpers/filterParamsHelper';

const getCookieProps = () => {
  if (config.environment === 'development') {
    return {
      // Secure: If present, the cookie is only sent when the URL begins with https://,
      // and will not be sent over an insecure connection.
      // to test from localhost or postman in development mode

      sameSite: 'None',
      secure: false,
    };
  }

  return {
    sameSite: 'None',
    secure: true,
  };
};

export const createUser = async (req, res) => {
  const data = req.body;
  const { email, login, password } = data;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }

  try {
    const customer = await User.findOne({ $or: [{ email }, { login }] }).lean();
    if (customer) {
      if (customer.email === email) {
        return res.status(400).json({
          message: `User with email ${customer.email} is already registered`,
        });
      }

      if (customer.login === login) {
        return res.status(400).json({
          message: `User with login ${customer.login} is already registered`,
        });
      }
    }

    data.createdDate = getFormattedCurrentUTCDate();
    const newCustomer = new User({
      email: email && email.trim(),
      login: login && login.trim(),
      password: password && password.trim(),
    });

    try {
      const salt = await promisify(bcrypt.genSalt)(10);
      const hash = await promisify(bcrypt.hash)(newCustomer.password, salt);

      newCustomer.password = hash;
      newCustomer.createdDate = Date.now();

      const user = await newCustomer.save();
      const {
        token, tokenExpiresInMS,
        newRefreshToken, refTokenExpiresInMS,
      } = signUp(user);

      const expDate = new Date(moment().add(refTokenExpiresInMS, 'ms'));
      const expDateShort = new Date(moment().add(tokenExpiresInMS, 'ms'));

      return res.status(200)
        .cookie('refreshToken', newRefreshToken, {
          expires: expDate,
          httpOnly: true,
          ...getCookieProps(),
        })
        .cookie('token', token, {
          expires: expDateShort,
          ...getCookieProps(),
        })
        .json({
          user: {
            _id: user._id,
            email: user.email,
            login: user.login,
          },
          token: {
            token,
            expires: expDateShort,
          },
        });
    } catch (error) {
      return res.status(400).json({
        message: `Error happened on server: ${error.message}`,
      });
    }
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Error happened on server: "${error.message}" `,
    });
  }
};

export const getAllUsers = async (req, res) => {
  const perPage = Number(req.query.perPage);
  const startPage = Number(req.query.startPage);

  const { sort } = req.query;

  try {
    const count = await User.countDocuments();
    const users = await User.find()
      .skip(startPage * perPage - perPage)
      .limit(perPage)
      .sort(sort)
      .lean();

    const usersData = users.map((user) => {
      const usr = { ...user };
      const { phone, email } = usr;

      if (config.hideUsersDataFromAdmin) {
        // hiding user private data
        usr.phone = phone ? `XXXX-XXXX-${phone.slice(8)}` : '';
        usr.email = email ? `XXXX-XXXX-${email.split('@')[1]}` : '';
      }

      usr.password = 'XXXXX';

      return usr;
    });

    return res.status(200).json({ usersData, totalCount: count });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting users data error: ${error}`,
    });
  }
};

export const getUser = async (req, res) => {
  const tokenFromCookie = getTokenFromCookie(req);

  try {
    const user = await User.findById(req.user.id).lean();

    if (!tokenFromCookie) {
      // means token is expired, but refToken is ok
      const {
        fingerprint, email, login,
        password, firstName, lastName, id,
      } = user;

      const { token, tokenExpiresInMS } = signUp({
        fingerprint,
        email,
        login,
        password,
        firstName,
        lastName,
        _id: id,
      }, fingerprint);

      user.password = 'XXXXX';

      return res.status(200)
        .cookie('token', token, {
          expires: new Date(moment().add(tokenExpiresInMS, 'ms')),
          ...getCookieProps(),
        })
        .json({
          user,
          token: {
            token,
            expires: new Date(moment().add(tokenExpiresInMS, 'ms')),
          },
        });
    }

    return res.status(200).json({ user });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `get user data error: "${error.message}" `,
    });
  }
};

export const confirmEmail = async (req, res) => {
  const { email } = req.query;
  if (!email || (email && !validator.isEmail(email))) {
    return res.status(400).json({
      message: 'incorrect email to confirm',
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: `user with email: ${email} is not found`,
      });
    }

    user.confirmedEmail = true;
    await user.save();
    return res.status(200).json({ user });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `email confirmation. get user data error: "${error.message}" `,
    });
  }
};

export const sendConfirmEmailLetter = (req, res) => {
  const { email } = req.query;

  sendEmailAddressConfirmation(email, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({ message: 'Please, check your email' });
  });
};

export const sendRecovery = async (req, res) => {
  const { email } = req.query;
  const token = signUpRecover({ email }, config.secret);

  try {
    const user = await User.findOne({ email });
    if (user) {
      try {
        await promisify(sendRecoveryPasswordLetter)(email, token);
        return res.status(200).json({ message: 'Please, check your email' });
      } catch (error) {
        log(error);
        return res.status(400).json({
          message: `send recovery mail error: "${error.message}"`,
        });
      }
    } else {
      return res.status(200).json({
        message: `User with email ${email} not found`,
      });
    }
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `find user by email error: "${error.message}"`,
    });
  }
};

export const recoverPassword = async (req, res) => {
  const { newPassword, email } = req.body;

  if (!email) {
    return res.status(400)
      .json({ message: 'To recover your password specify email address' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400)
      .json({ message: 'incorrect email for mailing' });
  }

  if (!newPassword) {
    return res.status(400)
      .json({ message: 'empty password. rejection' });
  }

  try {
    const user = await User.findOne({ email });
    if (user) {
      const salt = await promisify(bcrypt.genSalt)(10);
      user.password = await promisify(bcrypt.hash)(newPassword, salt);
      user.updatedDate = getFormattedCurrentUTCDate();
      await user.save();
      return res.status(200).json({ message: 'success recovery' });
    }

    return res.status(400).json({
      message: `Rejection! User  with email is not found ${email}`,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `recovery password error: "${error.message}" `,
    });
  }
};

export const updateUserInfo = async (req, res) => {
  const id = req.body.id || req.user.id;

  if (!id) {
    return res.status(400).json({
      message: 'update user data error. User id is required',
    });
  }

  const filePath = req.file ? req.file.path || req.file.location : null;

  const data = {
    ...req.body,
    updatedDate: getFormattedCurrentUTCDate(),
    avatarUrl: filePath,
  };

  // can't set user is admin
  delete data.isAdmin;

  try {
    const user = await User.findByIdAndUpdate(id, { $set: data },
      { new: true, runValidators: true });
    if (!user) {
      return res.status(400)
        .json({ message: `User with id "${id}" is not found.` });
    }

    return res.status(200).json(user);
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `update user data error: "${error.message}" `,
    });
  }
};

export const loginUser = async (req, res) => {
  const data = req.body;
  const { login, password, fingerprint } = data;

  const { cookie } = req.headers;
  const oldRefToken = cookie && cookie.split('=').length ? cookie.split('=')[1] : null;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login and password are required' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: login }, { login }],
    });

    if (!user) {
      return res.status(400).json({
        message: 'User is not found. Please check your login and password',
      });
    }

    const isMatch = await promisify(bcrypt.compare)(password, user.password);

    if (isMatch) {
      user.lastLoginDate = moment.utc();
      await user.save();

      const {
        token, tokenExpiresInMS, newRefreshToken, refTokenExpiresInMS,
      } = signUp(user, fingerprint);

      const filters = oldRefToken
        ? { $and: [{ userId: user._id }, { token: oldRefToken }] }
        : { userId: user._id };

      const expDate = new Date(moment().add(refTokenExpiresInMS, 'ms'));
      const expDateShort = new Date(moment().add(tokenExpiresInMS, 'ms'));

      const savedRT = await RefreshToken.findOne(filters);

      if (savedRT) {
        if (new Date(savedRT.exp) > Date.now()) {
          // refToken is not expired. just return new plain token and old refresh token
          return res.status(200)
            .cookie('refreshToken', savedRT.token, {
              expires: new Date(savedRT.exp),
              httpOnly: true,
              ...getCookieProps(),
            })
            .cookie('token', token, {
              expires: expDateShort,
              ...getCookieProps(),
            })
            .json({
              user,
              token: {
                token,
                expires: expDateShort,
              },
            });
        }

        // refresh token is expired ->> delete old one from DB, save new one
        await savedRT.remove();

        await new RefreshToken({
          token: newRefreshToken,

          // save exp dateTime in ms in DB
          exp: Number(moment().add(refTokenExpiresInMS, 'ms')),
          userId: user._id,
          createdDate: getFormattedCurrentUTCDate(),
        }).save();

        return res.status(200)
          .cookie('refreshToken', newRefreshToken, {
            expires: expDate,
            httpOnly: true,
            ...getCookieProps(),
          })
          .cookie('token', token, {
            expires: expDateShort,
            ...getCookieProps(),
          })
          .json({
            user,
            token: {
              token,
              expires: expDateShort,
            },
          });
      }

      // first login. no refresh token yet ->> create new RT in DB
      await new RefreshToken({
        token: newRefreshToken,
        exp: Number(moment().add(refTokenExpiresInMS, 'ms')), // save exp dateTime in ms in DB
        userId: user._id,
        createdDate: getFormattedCurrentUTCDate(),
      }).save();

      return res.status(200)
        .cookie('refreshToken', newRefreshToken, {
          expires: expDate,
          httpOnly: true,
          ...getCookieProps(),
        })
        .cookie('token', token, {
          expires: expDateShort,
          ...getCookieProps(),
        })
        .json({
          user,
          token: {
            token,
            expires: expDateShort,
          },
        });
    }

    return res.status(400).json({
      message: 'Password doesnt match',
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Login process error: "${error.message}" `,
    });
  }
};

export const refreshToken = async (req, res) => {
  const prefix = config.tokenPrefix;
  const refToken = getRefreshTokenFromCookie(req);
  if (!refToken) {
    return res.status(200).json({
      success: false,
      message: 'Refresh token is invalid. Please login again',
    });
  }

  try {
    const data = await promisify(jwt.verify)(refToken, config.secret);
    if (Date.now() > data.exp) {
      return res.status(200).json({
        success: false,
        message: 'Refresh token is expired. Please login again',
      });
    }

    try {
      const savedRefToken = await RefreshToken.findOne({ token: prefix + refToken });

      if (savedRefToken) {
        const {
          fingerprint, email, login,
          password, firstName, lastName, id,
        } = savedRefToken.userId;

        const { token, tokenExpiresInMS } = signUp({
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
            ...getCookieProps(),
          })
          .json({
            success: true,
            user: savedRefToken.user,
            token: {
              token,
              expires: new Date(moment().add(tokenExpiresInMS, 'ms')),
            },
          });
      }

      return res.status(200)
        .json({
          success: false,
          message: 'Refresh token is invalid. Please login again',
        });
    } catch (e) {
      log(e);
      return res.status(400).json({
        success: false,
        message: `Refresh token error: "${e.message}" `,
      });
    }
  } catch (error) {
    try {
      const token = await RefreshToken.findOne({ token: refToken });

      if (token) {
        await token.remove();
        log('refToken is successfully  removed from db');
      }

      return res.status(200).json({
        success: false,
        message: 'Refresh token is invalid. Please login again',
      });
    } catch (e) {
      log(error);
      return res.status(400).json({
        success: false,
        message: `Refresh token delete error: "${error.message}" `,
      });
    }
  }
};

export const logout = async (req, res) => {
  const refToken = getRefreshTokenFromCookie(req);
  const token = getTokenFromCookie(req);

  if (refToken || token) {
    try {
      const savedRT = await RefreshToken.findOne({ token: refToken });
      if (savedRT) {
        await savedRT.remove();
      }
    } catch (e) {
      log(e);
      return res.status(400).json({
        message: `Logout error: "${e.message}" `,
      });
    }

    const expSoon = new Date(moment().add(10, 'ms'));
    return res.status(200)
      .cookie('refreshToken', refToken, {
        expires: expSoon,
        httpOnly: true,
        ...getCookieProps(),
      })
      .cookie('token', token, {
        expires: expSoon,
        ...getCookieProps(),
      })
      .json({
        message: 'success',
      });
  }

  return res.status(200).json({ message: 'success' });
};

export const updatePassword = async (req, res) => {
  const data = req.body;
  let { newPassword } = data;
  const { oldPassword } = data;
  const { id } = req.user;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'newPassword, oldPassword are required' });
  }

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'error: invalid id' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({
        message: 'User is not found',
      });
    }

    const isMatch = await promisify(user.comparePassword).bind(user, oldPassword)();
    if (!isMatch) {
      return res.status(400).json({
        message: 'old password doesnt match',
      });
    }

    const salt = await promisify(bcrypt.genSalt)(10);
    newPassword = await promisify(bcrypt.hash)(newPassword, salt);

    user.password = newPassword;
    user.updatedDate = getFormattedCurrentUTCDate();
    const updatedUser = await user.save();
    const { phoneNumber, email } = updatedUser;

    if (config.hideUsersDataFromAdmin) {
      // hiding user private data
      updatedUser.phoneNumber = phoneNumber ? `XXXX-XXXX-${phoneNumber.slice(8)}` : '';
      updatedUser.email = email ? `XXXX-XXXX-${email.split('@')[1]}` : '';
    }

    updatedUser.password = 'XXXXX';

    return res.status(200).json({
      message: 'Password successfully changed',
      customer: updatedUser,
    });
  } catch (error) {
    log(error.message);
    return res.status(400).json({
      message: `Update password error: "${error.message}" `,
    });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await User.findByIdAndRemove(id);
    if (!item) {
      return res.status(200).json({
        message: `User with id ${id} is not found`,
      });
    }

    return res.status(200).json({
      message: `User with id "${id}" is deleted`,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete user data error: "${error.message}" `,
    });
  }
};

export const deleteAllUsers = async (req, res) => {
  try {
    await User.deleteMany({ isAdmin: false });
    return res.status(200).json({
      message: 'all users except admins are deleted',
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete users error "${error.message}" `,
    });
  }
};
