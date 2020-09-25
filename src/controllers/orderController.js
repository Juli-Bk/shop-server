import Order from '../models/schemas/Order';
import {log} from '../helpers/helper';
import moment from 'moment';
import {sendOrderLetter} from '../mailing/mailgun';
import config from '../config/index';
import crypto from 'crypto';

export const placeOrder = (req, res, next) => {
    const data = {...req.body};
    if (!data.products.length) {
        return res.status(400)
            .json({
                message: `error: can't create an order with empty products list`,
            });
    }

    if (!data.userId) {
        data.orderAsGuest = true;

        if (!data.email) {
            return res.status(400)
                .json({
                    message: `error: email is required`,
                });
        }
    }
    data.createdDate = moment.utc().format('MM-DD-YYYY');

    const order = new Order(data);

    order.save()
        .then((newOrder) => {
            const {firstName = '', lastName = '', email} = newOrder.userId || {};
            const orderDate = moment(newOrder.createdDate).format('DD.MM.YYYY').toString();
            const products = newOrder.products.map(pr => {
                const {name, price, salePrice} = pr.productId;
                const orderPrice = salePrice < price ? salePrice : price;
                return {name, price: orderPrice, quantity: pr.quantity};
            });
            const orderData = {
                clientName: newOrder.userName || `${firstName} ${lastName}`,
                orderNumber: newOrder.orderNo,
                orderDate: orderDate,
                status: newOrder.status,
                products,
                total: newOrder.totalSum,
            };

            sendOrderLetter(newOrder.email || email, orderData, (error, body) => {
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
                return res
                    .status(200)
                    .json({
                        message: 'Success operation. The order is placed',
                        newOrder,
                        letterStatus,
                    });
            });

        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Placing order error: ${error.message}`,
                    });
                log(error);
                next(error);
            },
        );

};

export const getAllOrders = (req, res, next) => {
    Order
        .find()
        .lean()
        .then(items => {
                return res.status(200)
                    .send({items});
            },
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting orders error: ${error.message}`,
                    });
                next(error);
            },
        );
};

export const getUserOrders = (req, res, next) => {
    const userId = req.params.id;

    if (!userId) {
        res.status(400)
            .json({
                message: `error: user id parameter is required" `,
            });
    }

    Order.find({userId: userId})
        .lean()
        .then(userOrders => {
            return res.status(200)
                .send({userOrders: userOrders});
        })
        .catch(error => {
            res.status(400)
                .json({
                    message: `Getting user orders error: ${error.message}`,
                });
            next(error);
        });
};

export const cancelOrder = (req, res, next) => {
    const orderId = req.params.id;

    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                res.status(400)
                    .json({
                        message: `order with ${orderId} is not found`,
                    });

            } else {
                order.canceled = true;
                order.updatedDate = moment.utc().format('MM-DD-YYYY');
                order.status = 'canceled';
                order.save()
                    .then(() => {
                        res.status(200).json({
                            message: 'Success operation. The order is canceled',
                        });
                    })
                    .catch(error => {
                        res.status(400)
                            .json({
                                message: `cancel order error: "${error.message}" `,
                            });
                        log(error);
                        next(error);
                    });
            }
        })
        .catch(error => {
            res.status(400)
                .json({
                    message: `cancel order error: "${error.message}" `,
                });
            log(error);
            next(error);
        });
};

export const updateOrderById = (req, res, next) => {
    const orderId = req.params.id;

    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                res.status(400)
                    .json({
                        message: `order with ${orderId} is not found`,
                    });

            } else {
                const data = {...req.body};
                Order
                    .findOneAndUpdate(
                        {_id: orderId},
                        {$set: data},
                        {new: true, runValidators: true},
                    )
                    .then(order => res.status(200).json(order))
                    .catch(err =>
                        res.status(400).json({
                            message: `Error happened on server: "${err}" `,
                        }),
                    );
            }
        })
        .catch(error => {
            res.status(400)
                .json({
                    message: `cancel order error: "${error.message}" `,
                });
            log(error);
            next(error);
        });
};

export const deleteOrderById = (req, res, next) => {
    Order
        .findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(200)
                .json({
                    message: `Order with id "${req.params.id}" is deleted`,
                });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete order error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteAllOrders = (req, res, next) => {
    Order.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all Order data are deleted',
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete Order data error "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const updateOrderPaymentStatus = async (req, res, next) => {

    const data = req.body.data;

    if (!data) {
        return res.status(200).json({
            message: 'empty data from liqpay',
        });
    } else {

        const privateKey = config.liqpay_private_key;
        const signatureFromReq = req.body.signature;

        if (!signatureFromReq) {
            return res.status(400).json({
                message: 'empty signature. forbidden',
            });
        }
        const signString = privateKey + data + privateKey;

        const sha1 = crypto.createHash('sha1');
        sha1.update(signString);

        const signature = sha1.digest('base64');

        if (signatureFromReq !== signature) {
            return res.status(400).json({
                message: 'updateOrderPaymentStatus error: signature does not match',
            });
        } else {
            const d = Buffer.from(data, 'base64');
            const dataDecoded = await JSON.parse(d.toString());

            const orderId = dataDecoded.order_id;
            const status = dataDecoded.status;

            Order.findById(orderId)
                .then((order) => {
                    if (!order) {
                        return res.status(400)
                            .json({
                                message: `order with ${orderId} is not found`,
                            });
                    } else {
                        delete dataDecoded.public_key;
                        const data = {
                            liqPayInfo: dataDecoded,
                            //wait_accept значит что, деньги с клиента списаны, но магазин еще не прошел проверку.
                            //Если магазин не пройдет активацию в течение 180 дней,
                            //платежи будут автоматически отменены
                            isPaid: (status === 'success') || (status === 'wait_accept'),
                            liqPayPaymentStatus: status,
                        };
                        Order
                            .findOneAndUpdate(
                                {_id: orderId},
                                {$set: data},
                                {new: true, runValidators: true},
                            )
                            .then(order => {
                                return res.status(200).json(order);
                            })
                            .catch(error => {
                                    res.status(400).json({
                                        message: `Error happened on server: "${error}" `,
                                    });
                                    log(error);
                                    next(error);
                                },
                            );
                    }
                })
                .catch(error => {
                    res.status(400)
                        .json({
                            message: `cancel order error: "${error.message}" `,
                        });
                    log(error);
                    next(error);
                });
        }
    }
};


