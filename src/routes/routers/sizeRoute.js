import express from 'express';

import {
    addSize,
    deleteAllSizes,
    deleteSizeById,
    getAllSizes,
    getSizeById,
    updateSizeById
} from '../../controllers/sizeController';
import passport from 'passport';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    addSize);

//read
router.get('/', getAllSizes);
router.get('/:id', getSizeById);

//update
router.post('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    updateSizeById);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteSizeById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllSizes);

export default router;