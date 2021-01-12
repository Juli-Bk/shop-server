import express from 'express';

import passport from 'passport';
import {
  addBrand,
  deleteAllBrands,
  deleteBrandById,
  getAllBrands,
  getBrandById,
  updateBrandById,
} from '../../controllers/brandController';
import uploadAWS from '../../uploading/uploadAWS';
import config from '../../config/index';

const { options } = config.expressRoutes;

const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    uploadAWS.single('brand-image'), addBrand,
  ]);

// read
router.get('/', getAllBrands);
router.get('/:id', getBrandById);

// update
router.post('/:id',
  [
    passport.authenticate('jwt-admin', options),
    uploadAWS.single('brand-image'),
    updateBrandById,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteBrandById,
  ]);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllBrands,
  ]);

export default router;
