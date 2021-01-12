import passport from 'passport';
import express from 'express';
import uploadAWS from '../../uploading/uploadAWS';

import {
  createUser,
  getAllUsers,
  getUser,
  deleteUserById,
  deleteAllUsers,
  updateUserInfo,
  loginUser,
  updatePassword,
  refreshToken,
  logout,
  confirmEmail,
  recoverPassword,
  sendRecovery,
  sendConfirmEmailLetter,
} from '../../controllers/userController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/register', createUser);

// read
router.get('/',
  [
    passport.authenticate('jwt-admin', options),
    getAllUsers,
  ]);

router.get('/customer',
  [
    passport.authenticate('jwt', options),
    getUser,
  ]);

router.post('/login', loginUser);

router.post('/confirmation', sendConfirmEmailLetter);
router.post('/email-confirmation', confirmEmail);

router.post('/recovery', sendRecovery);
router.post('/password-recovery',
  [
    passport.authenticate('recover', options),
    recoverPassword,
  ]);

router.post('/logout', logout);
router.post('/login/refresh', refreshToken);

// update
router.post('/',
  [
    passport.authenticate('jwt', options),
    uploadAWS.single('user-avatar'),
    updateUserInfo,
  ]);

router.post('/password',
  [
    passport.authenticate('jwt', options),
    updatePassword,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteUserById,
  ]);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllUsers,
  ]);

export default router;
