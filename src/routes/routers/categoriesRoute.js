import express from 'express';

import passport from 'passport';
import {
  addCategory,
  deleteAllCategories,
  deleteCategoryById,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
} from '../../controllers/categoryController';
import uploadAWS from '../../uploading/uploadAWS';
import config from '../../config/index';

const { options } = config.expressRoutes;

const router = express.Router();

// create
router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    uploadAWS.single('category-image'),
    addCategory,
  ]);

// read
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// update
router.post('/:id',
  [
    passport.authenticate('jwt-admin', options),
    uploadAWS.single('category-image'),
    updateCategoryById,
  ]);

// delete
router.delete('/:id',
  [
    passport.authenticate('jwt-admin', options),
    deleteCategoryById,
  ]);
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllCategories,
  ]);

export default router;
