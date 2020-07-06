import express from 'express';
import bodyParser from 'body-parser';

import {
    placeOrder,
    deleteAllOrders,
    deleteOrderById,
    getAllOrders,
    getUserOrders,
    cancelOrder,
    updateOrderById,
    updateOrderPaymentStatus
} from '../controllers/orderController';
import passport from 'passport';

const router = express.Router();

//create
router.put('/', placeOrder);

//read
router.get('/',
    passport.authenticate('jwt-admin', {session: false}),
    getAllOrders);
router.get('/:id',
    passport.authenticate('jwt', {session: false}),
    getUserOrders);

//update
router.post('/cancel/:id', cancelOrder);

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })

router.post('/liqpay/order-payment', urlencodedParser, updateOrderPaymentStatus);
router.post('/:id', updateOrderById);

//delete
router.delete('/',
    passport.authenticate('jwt-admin', {session: false}),
    deleteAllOrders);
router.delete('/:id',
    passport.authenticate('jwt', {session: false}),
    deleteOrderById);

export default router;