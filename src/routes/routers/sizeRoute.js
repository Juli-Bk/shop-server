import express from 'express';

import passport from 'passport';
import {
  addSize,
  deleteAllSizes,
  deleteSizeById,
  getAllSizes,
  getSizeById,
  updateSizeById,
} from '../../controllers/sizeController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    addSize,
  ]);

// read
router.get('/', getAllSizes);
router.get('/:id', getSizeById);

// update
router.post('/:id',
  [
    passport.authenticate('jwt-admin', options),
    updateSizeById,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteSizeById,
  ]);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllSizes,
  ]);

export default router;
