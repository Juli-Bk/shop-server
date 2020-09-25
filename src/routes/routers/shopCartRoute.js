import passport from 'passport';
import express from 'express';

import {
    createShopCart,
    getAllUShopCarts,
    getUserShopCart,
    deleteShopCartById,
    deleteAllShopCarts,
    updateShopCartById
} from '../../controllers/shopCartController';

const router = express.Router();

//create
router.put('/', createShopCart);

//read
router.get('/',
    passport.authenticate('jwt-admin', {session: false}),
    getAllUShopCarts);

router.get('/:id', getUserShopCart);

//update
router.post('/:id', updateShopCartById);

//delete
router.delete('/:id', deleteShopCartById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllShopCarts);

export default router;
