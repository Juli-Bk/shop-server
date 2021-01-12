import passport from 'passport';
import express from 'express';

import {
  createShopCart,
  getAllUShopCarts,
  getUserShopCart,
  deleteShopCartById,
  deleteAllShopCarts,
  updateShopCartById,
} from '../../controllers/shopCartController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/', createShopCart);

// read
router.get('/',
  [
    passport.authenticate('jwt-admin', options),
    getAllUShopCarts,
  ]);

router.get('/:id', getUserShopCart);

// update
router.post('/:id', updateShopCartById);

// delete
router.delete('/:id', deleteShopCartById);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllShopCarts,
  ]);

export default router;
