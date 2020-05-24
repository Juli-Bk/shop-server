import upload from '../config/upload';
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
    updatePassword
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

//update
router.post('/',
    passport.authenticate('jwt', {session: false}),
    upload.single('user-avatar'),
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
