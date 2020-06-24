import Order from '../models/schemas/Order';
import {log} from '../utils/helper';
import moment from 'moment';

export const placeOrder = (req, res, next) => {
    const data = {...req.body};
    if (!data.products.length) {
        res.status(400)
            .json({
                message: `error: can't create an order with empty products list`,
            });
    }
    if (!data.userId) {
        data.orderAsGuest = true;
    }
    data.createdDate = moment.utc().format('MM-DD-YYYY');

    const order = new Order(data);

    order
        .save()
        .then(() => res
            .status(200)
            .json({
                message: 'Success operation. The order is placed',
                order,
            }),
        )
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
                            message: 'Success operation. The order is canceled'
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

