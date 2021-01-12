import express from 'express';

import passport from 'passport';
import {
  addProductToWishList,
  deleteAllWishes,
  deleteProductFromWishlist,
  getAllWishListData,
  getUserWishes,
} from '../../controllers/wishListController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt', options),
    addProductToWishList,
  ]);

// read
router.get('/',
  [
    passport.authenticate('jwt-admin', options),
    getAllWishListData,
  ]);
router.get('/:id', getUserWishes);

// update
router.delete('/:id',
  [
    passport.authenticate('jwt', options),
    deleteProductFromWishlist,
  ]);

// delete
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllWishes,
  ]);

export default router;
