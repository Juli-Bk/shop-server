import moment from 'moment';
import crypto from 'crypto';
import Order from '../models/schemas/Order';
import User from '../models/schemas/User';
import { log, getFormattedCurrentDate } from '../helpers/helper';
import { sendOrderLetter } from '../mailing/mailgun';
import config from '../config/index';
import Quantity from '../models/schemas/Quantity';
import Product from '../models/schemas/Product';

const checkIsInStock = async (products) => {
  const isInStock = { error: false };

  const queries = products.map(async (product) => {
    const {
      quantity, productId, sizeId, colorId,
    } = product;

    if (!quantity) {
      throw new Error(`placing order: for product${productId} with size
       ${sizeId} and color ${colorId} quantity is required`);
    }

    const conditions = {
      productId,
      sizeId,
      colorId,
      quantity: {
        $gt: 0,
      },
    };
    const stock = await Quantity.find(conditions);

    const rez = {};
    if (!stock.length) {
      rez.error = true;
      rez.errorMessage = `error: product ${productId} with chosen`
        + ' color and size is not in stock anymore';
    } else if (stock[0].quantity < quantity) {
      rez.error = true;
      rez.errorMessage = `error: product ${productId} with chosen`
        + `color and size is only ${stock[0].quantity} items available`;
    }

    return rez;
  });

  const results = await Promise.all(queries);

  const isNotInStock = results.find((result) => result.error === true);
  return isNotInStock || isInStock;
};

const getOrderTotalSum = async (products) => {
  const productsIds = products.map((pr) => pr.productId);

  const conditions = {
    _id: {
      $in: productsIds,
    },
  };

  const fieldsToSelect = ['price', 'salePrice', 'isOnSale', '_id'];
  const productsData = await Product.find(conditions, fieldsToSelect).lean();

  const productsCost = products.map((prData) => {
    const product = productsData.find((pr) => prData.productId === pr._id.toString());
    if (!product) throw new Error('product is not found. Can`t calculate order sum');
    const order = {
      price: product.isOnSale ? product.salePrice : product.price,
      quantity: prData.quantity,
    };
    return order.price * order.quantity;
  });

  const totalSum = productsCost.reduce((a, b) => a + b, 0);
  return totalSum;
};

export const placeOrder = async (req, res) => {
  const data = { ...req.body };
  if (data.product && !data.products.length) {
    return res.status(400).json({
      message: 'error: empty products list',
    });
  }

  if (!data.userId) {
    data.orderAsGuest = true;

    if (!data.email) {
      return res.status(400).json({
        message: 'error: email is required',
      });
    }
  } else if (!data.email) {
    const fieldsToSelect = ['email', 'phoneNumber', 'firstName', 'lastName'];
    const user = await User.findById(data.userId, fieldsToSelect).lean();
    data.email = user.email;
    data.phoneNumber = user.phoneNumber;
    data.userName = `${user.firstName} ${user.lastName}`;
  }

  data.totalSum = await getOrderTotalSum(data.products);

  data.createdDate = getFormattedCurrentDate();
  try {
    const inStock = await checkIsInStock(data.products);

    if (inStock.error) {
      return res.status(400).json({
        message: inStock.errorMessage,
      });
    }
  } catch (e) {
    return res.status(400).json({
      message: e.message,
    });
  }

  try {
    const newOrder = await new Order(data).save();
    const { firstName = '', lastName = '', email } = newOrder.userId || {};
    const orderDate = moment(newOrder.createdDate).format('DD.MM.YYYY').toString();
    const products = newOrder.products.map((pr) => {
      const { name, price, salePrice } = pr.productId;
      const orderPrice = salePrice < price ? salePrice : price;
      return { name, price: orderPrice, quantity: pr.quantity };
    });

    const orderData = {
      clientName: newOrder.userName || `${firstName} ${lastName}`,
      orderNumber: newOrder.orderNo,
      orderDate,
      status: newOrder.status,
      products,
      total: newOrder.totalSum,
    };

    const mail = newOrder.email || email;
    sendOrderLetter(mail, orderData, (error, body) => {
      let letterStatus = {
        message: body,
        error: false,
      };
      if (error) {
        letterStatus = {
          message: error.message,
          error: true,
        };
      }

      return res.status(200).json({
        message: 'Success operation. The order is placed',
        letterStatus,
        newOrder,
      });
    });

    return '';
  } catch (e) {
    const message = `Placing order error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const items = await Order.find().lean();
    return res.status(200).json({ items });
  } catch (e) {
    const message = `Getting all orders error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const getUserOrders = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({
      message: 'error: user id parameter is required" ',
    });
  }

  try {
    const userOrders = await Order.find({ userId });
    return res.status(200).json({ userOrders });
  } catch (e) {
    const message = `Getting user orders error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const cancelOrder = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(400).json({
        message: `order with ${orderId} is not found`,
      });
    }

    order.canceled = true;
    order.updatedDate = getFormattedCurrentDate();
    order.status = 'canceled';
    await order.save();

    return res.status(200).json({
      message: 'Success operation. The order is canceled',
    });
  } catch (e) {
    const message = `Cancel order error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const updateOrderById = async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(400).json({
        message: `order with ${orderId} is not found`,
      });
    }

    const data = { ...req.body };
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: data },
      { new: true, runValidators: true },
    );

    return res.status(200).json(updatedOrder);
  } catch (e) {
    const message = `Updating order error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndRemove(id);
    if (!order) {
      return res.status(400).json({
        message: `order with ${id} is not found`,
      });
    }

    return res.status(200).json({ message: `Order with id "${id}" is deleted` });
  } catch (e) {
    const message = `Deleting order by id  error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

export const deleteAllOrders = async (req, res) => {
  try {
    await Order.deleteMany({}).lean();
    return res.status(200).json({ message: 'all Order data are deleted' });
  } catch (e) {
    const message = `Deleting all orders error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};

const checkLickPaySignature = (data) => {
  const privateKey = config.liqpay_private_key;
  const signString = privateKey + data + privateKey;
  const signatureFromReq = data.signature;
  if (!signatureFromReq) {
    return false;
  }

  const sha1 = crypto.createHash('sha1');
  sha1.update(signString);
  const signature = sha1.digest('base64');

  return signatureFromReq !== signature;
};

const deletePublicKey = (obj) => {
  const cleared = { ...obj };
  delete cleared.public_key;
  return cleared;
};

const getDecodedPaymentData = (data) => {
  const buffer = Buffer.from(data, 'base64');
  const dataDecoded = JSON.parse(buffer.toString());
  const secured = deletePublicKey(dataDecoded);

  return {
    orderId: secured.order_id,
    status: secured.status,
    secured,
  };
};

export const updateOrderPaymentStatus = async (req, res) => {
  const { data: liqPayment } = req.body;

  if (!liqPayment) {
    return res.status(200).json({
      message: 'empty data from liqpay',
    });
  }

  if (checkLickPaySignature(liqPayment)) {
    return res.status(400).json({
      message: 'updateOrderPaymentStatus error: signature does not match',
    });
  }

  const { orderId, status, dataDecoded } = getDecodedPaymentData(liqPayment);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({
        message: `order with ${orderId} is not found`,
      });
    }

    // wait_accept значит что, деньги с клиента списаны,
    // но магазин еще не прошел проверку.
    // Если магазин не пройдет активацию в течение 180 дней,
    // платежи будут автоматически отменены
    const lpData = {
      liqPayInfo: dataDecoded,
      isPaid: (status === 'success') || (status === 'wait_accept'),
      liqPayPaymentStatus: status,
    };

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: lpData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({ order: updatedOrder });
  } catch (e) {
    const message = `Changing order payment status error. 💥 ${e.message}`;
    log(message);
    return res.status(400).json({ message });
  }
};
