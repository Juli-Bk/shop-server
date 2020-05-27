import passport from 'passport';
import express from 'express';

import {
    subscribe,
    unsubscribe,
    deleteAllSubscribers,
    getAllSubscribers
} from '../controllers/subscriberController';

const router = express.Router();

//create
router.put('/subscribe',
    passport.authenticate('jwt', {session: false}),
    subscribe);

//read
router.get('/',
    passport.authenticate('jwt-admin', {session: false}),
    getAllSubscribers);

//update
router.post('/unsubscribe',
    passport.authenticate('jwt', {session: false}),
    unsubscribe);


//delete
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllSubscribers);

export default router;
