import express from 'express';
import bodyParser from 'body-parser';

import passport from 'passport';
import {
  placeOrder,
  deleteAllOrders,
  deleteOrderById,
  getAllOrders,
  getUserOrders,
  cancelOrder,
  updateOrderById,
  updateOrderPaymentStatus,
} from '../../controllers/orderController';
import config from '../../config/index';

const { options } = config.expressRoutes;
const router = express.Router();

// create
router.put('/', placeOrder);

// read
router.get('/',
  [
    passport.authenticate('jwt-admin', options),
    getAllOrders,
  ]);
router.get('/:id',
  [
    passport.authenticate('jwt', options),
    getUserOrders,
  ]);

// update
router.post('/cancel/:id', cancelOrder);

// application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });
router.post('/liqpay/order-payment',
  [
    urlencodedParser,
    updateOrderPaymentStatus,
  ]);

router.post('/:id', updateOrderById);

// delete
router.delete('/',
  [
    passport.authenticate('jwt-admin', options),
    deleteAllOrders,
  ]);
router.delete('/:id',
  [
    passport.authenticate('jwt', options),
    deleteOrderById,
  ]);

export default router;
