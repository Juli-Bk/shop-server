import express from 'express';
import upload from '../config/upload';

import {
    addBrand,
    deleteAllBrands,
    deleteBrandById,
    getAllBrands,
    getBrandById,
    updateBrandById
} from '../controllers/brandController';
import passport from 'passport';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    upload.single('brand-image'), addBrand);

//read
router.get('/', getAllBrands);
router.get('/:id', getBrandById);

//update
router.post('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    upload.single('brand-image'),
    updateBrandById);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteBrandById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllBrands);

export default router;