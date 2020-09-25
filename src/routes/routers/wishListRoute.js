import express from 'express';

import {
    addProductToWishList,
    deleteAllWishes,
    deleteProductFromWishlist,
    getAllWishListData,
    getUserWishes
} from '../../controllers/wishListController';
import passport from 'passport';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt', {session: false}),
    addProductToWishList);

//read
router.get('/',
    passport.authenticate('jwt-admin', {session: false}),
    getAllWishListData);
router.get('/:id', getUserWishes);

//update
router.delete('/:id',
    passport.authenticate('jwt', {session: false}),
    deleteProductFromWishlist);

//delete
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllWishes);

export default router;