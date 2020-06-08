import express from 'express';

import {
    addProduct,
    deleteAllProducts,
    deleteProductById,
    getAllProducts,
    getProductById,
    getProductsByFilterParams,
    searchProducts,
    updateProductById
} from '../controllers/productController';

import passport from 'passport';
import uploadAWS from '../config/uploadAWS';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    uploadAWS.array('product-images'),
    addProduct);

//read
router.get('/', getAllProducts);
router.get('/filter', getProductsByFilterParams);
router.post('/search', searchProducts);
router.get('/:id', getProductById);

//update
router.post('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    uploadAWS.array('product-images'),
    updateProductById);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteProductById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllProducts);

export default router;