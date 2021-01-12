import express from 'express';

import passport from 'passport';
import {
  addColor,
  getAllColors,
  getColorById,
  deleteAllColors,
  deleteColorById,
  updateColorById,
} from '../../controllers/colorController';
import config from '../../config';

const { options } = config.expressRoutes;

const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    addColor,
  ]);

// read
router.get('/', getAllColors);
router.get('/:id', getColorById);

// update
router.post('/:id',
  [
    passport.authenticate('jwt-admin', options),
    updateColorById,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteColorById,
  ]);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllColors,
  ]);

export default router;
