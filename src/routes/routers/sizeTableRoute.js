import express from 'express';

import passport from 'passport';
import {
  addSizeTable,
  deleteAllSizeTables,
  deleteSizeTableById,
  getAllSizeTables,
  getSizeTableByProductId,
  updateSizeTableById,
} from '../../controllers/sizeTableController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    addSizeTable,
  ]);

// read
router.get('/', getAllSizeTables);
router.get('/:id', getSizeTableByProductId);

// update
router.post('/:id',
  [
    passport.authenticate('jwt-admin', options),
    updateSizeTableById,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteSizeTableById,
  ]);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllSizeTables,
  ]);

export default router;
