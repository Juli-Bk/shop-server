import express from 'express';

import passport from 'passport';
import {
  addProduct,
  deleteAllProducts,
  deleteProductById,
  getAllProducts,
  getProductById,
  getProductsByFilterParams,
  searchProducts,
  updateProductById,
  getMaxPrice,
} from '../../controllers/productController';

import uploadAWS from '../../uploading/uploadAWS';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    uploadAWS.array('product-images'),
    addProduct,
  ]);

// read
router.get('/', getAllProducts);
router.get('/max', getMaxPrice);
router.get('/filter', getProductsByFilterParams);
router.post('/search', searchProducts);
router.get('/:id', getProductById);

// update
router.post('/:id',
  [
    passport.authenticate('jwt-admin', options),
    uploadAWS.array('product-images'),
    updateProductById,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteProductById,
  ]);
router.delete('/',
  [passport.authenticate('jwt-admin', options),
    deleteAllProducts,
  ]);

export default router;
