import express from 'express';

import {
    addQuantity,
    deleteAllQuantities,
    deleteQuantityById,
    getAllQuantity,
    getQuantityByProductId,
    updateQuantityById
} from '../../controllers/quantityController';
import passport from 'passport';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    addQuantity);

//read
router.get('/', getAllQuantity);
router.get('/:id', getQuantityByProductId);

//update
router.post('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    updateQuantityById);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteQuantityById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllQuantities);

export default router;