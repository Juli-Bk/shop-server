import express from 'express';

import {
    addColor,
    getAllColors,
    getColorById,
    deleteAllColors,
    deleteColorById,
    updateColorById
} from '../../controllers/colorController';
import passport from 'passport';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    addColor);

//read
router.get('/', getAllColors);
router.get('/:id', getColorById);

//update
router.post('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    updateColorById);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteColorById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllColors);

export default router;