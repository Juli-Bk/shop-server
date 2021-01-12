import express from 'express';

import passport from 'passport';
import {
  addQuantity,
  deleteAllQuantities,
  deleteQuantityById,
  getAllQuantity,
  getQuantityByProductId,
  updateQuantityById,
} from '../../controllers/quantityController';
import config from '../../config/index';

const { options } = config.expressRoutes;

const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    addQuantity,
  ]);

// read
router.get('/', getAllQuantity);
router.get('/:id', getQuantityByProductId);

// update
router.post('/:id',
  [
    passport.authenticate('jwt-admin', options),
    updateQuantityById,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteQuantityById,
  ]);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllQuantities,
  ]);

export default router;
