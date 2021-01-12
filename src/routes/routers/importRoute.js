import passport from 'passport';
import express from 'express';
import uploadJSON from '../../uploading/uploadJSON';

import importData from '../../controllers/importController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

router.put('/',
  [
    passport.authenticate('jwt-admin', options),
    uploadJSON.single('products-json'),
    importData,
  ]);

export default router;
