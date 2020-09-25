import express from 'express';

import {
    addSizeTable,
    deleteAllSizeTables,
    deleteSizeTableById,
    getAllSizeTables,
    getSizeTableByProductId,
    updateSizeTableById
} from '../../controllers/sizeTableController';
import passport from 'passport';

const router = express.Router();

//create
router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    addSizeTable);

//read
router.get('/', getAllSizeTables);
router.get('/:id', getSizeTableByProductId);

//update
router.post('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    updateSizeTableById);

//delete
router.delete('/:id',
    passport.authenticate('jwt-admin', {session: false}),
    deleteSizeTableById);
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllSizeTables);

export default router;