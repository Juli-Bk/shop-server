import uploadJSON from '../config/uploadJSON';
import passport from 'passport';
import express from 'express';

import {
    importData
} from '../controllers/importController';

const router = express.Router();

router.put('/',
    passport.authenticate('jwt-admin', {session: false}),
    uploadJSON.single('products-json'),
    importData);

export default router;
