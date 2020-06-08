import express from 'express';

import {
    addCategory,
    deleteAllCategories,
    deleteCategoryById,
    getAllCategories,
    getCategoryById,
    updateCategoryById
} from '../controllers/categoryController';
import passport from 'passport';
import uploadAWS from '../config/uploadAWS';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    uploadAWS.single('category-image'),
    addCategory);

//read
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

//update
router.post('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    uploadAWS.single('category-image'),
    updateCategoryById);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteCategoryById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllCategories);

export default router;