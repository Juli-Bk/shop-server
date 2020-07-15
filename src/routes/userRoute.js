import uploadAWS from '../config/uploadAWS';
import passport from 'passport';
import express from 'express';

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
    sendConfirmEmailLetter
} from '../controllers/userController';

const router = express.Router();

//create
router.put('/register', createUser);

//read
router.get('/',
    passport.authenticate('jwt-admin', {session: false}),
    getAllUsers);

router.get('/customer',
    passport.authenticate('jwt', {session: false}),
    getUser);

router.post('/login', loginUser);

router.post('/confirmation', sendConfirmEmailLetter);
router.post('/email-confirmation', confirmEmail);

router.post('/recovery', sendRecovery);
router.post('/password-recovery',
    passport.authenticate('recover', {session: false}),
    recoverPassword);

router.post('/logout', logout);
router.post('/login/refresh',
    refreshToken);

//update
router.post('/',
    passport.authenticate('jwt', {session: false}),
    uploadAWS.single('user-avatar'),
    updateUserInfo);

router.post('/password',
    passport.authenticate('jwt', {session: false}),
    updatePassword);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteUserById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllUsers);

export default router;
