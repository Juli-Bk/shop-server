import passport from 'passport';
import express from 'express';

import {
  subscribe,
  unsubscribe,
  deleteAllSubscribers,
  getAllSubscribers,
} from '../../controllers/subscriberController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/subscribe', // passport.authenticate('jwt', {session: false}),
  subscribe);

// read
router.get('/',
  [
    passport.authenticate('jwt-admin', options),
    getAllSubscribers,
  ]);

// update
router.post('/unsubscribe',
  [
    passport.authenticate('jwt', options),
    unsubscribe,
  ]);

// delete
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllSubscribers,
  ]);

export default router;
