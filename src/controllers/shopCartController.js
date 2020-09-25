import ShopCart from '../models/schemas/ShopCart';
import {log} from '../helpers/helper';
import moment from 'moment';

export const createShopCart = (req, res, next) => {
    const products = req.body.products;
    if (!Array.isArray(products)) {
        res.status(400)
            .json({
                message: `Products must be an Array of products`,
            });
    }

    if (!products.length) {
        res.status(400)
            .json({
                message: `Products list must be specified for shop cart`,
            });
    }

    const shopCartData = {
        ...req.body,
        createdDate: moment.utc().format('MM-DD-YYYY'),
    };

    const newProduct = new ShopCart(shopCartData);
    newProduct
        .save()
        .then(cart => res
            .status(200)
            .json({
                message: 'Success operation. Products are added to shop cart',
                cart: cart,
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Shop cart adding error: ${error}`,
                    });
                log(error);
                next(error);
            },
        );

};

export const getAllUShopCarts = async (req, res, next) => {
    ShopCart
        .find()
        .lean()
        .then(items => {
            res.status(200).json({
                carts: items,
                count: items.length,
            });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting shop carts data error: ${error.message}`,
                    });
                log(error);
                next(error);
            },
        );
};

export const getUserShopCart = (req, res, next) => {
    const userId = req.params.id;
    if (!userId) {
        res.status(400)
            .json({
                message: `User id must be specified to get shop cart`,
            });
    }
    ShopCart
        .findOne({userId: userId})
        .lean()
        .then(shopCart => {
            if (!shopCart) {
                res.status(200)
                    .json({
                        message: `Shop cart for user with id ${userId} is not found`,
                    });
            } else {
                res.status(200).json(shopCart);
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Error happened on server: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const updateShopCartById = (req, res, next) => {
    const shopCartId = req.params.id;

    const shopCart = {...req.body};

    shopCart.updatedDate = moment.utc().format('MM-DD-YYYY');
    if (!Array.isArray(shopCart.products)) {
        return res.status(400)
            .json({
                message: `Products must be an Array of products`,
            });
    }

    let hasProperStructure = true;

    shopCart.products.map(el => {
        if (!el.productId || !el.colorId || !el.sizeId || !el.cartQuantity) {
            hasProperStructure = false;
        }
    });

    if (!hasProperStructure) {
        return res.status(400)
            .json({
                message: `Products in shop cart should be like: {productId: "xxxx", colorId: "xxxx", sizeId: "xxxx", cartQuantity: "xxxx"}`,
            });
    }

    ShopCart
        .findOne({_id: shopCartId})
        .then(cart => {
            if (!cart) {
                return res.status(400)
                    .json({message: `Shop cart with id "${shopCartId}" is not found.`});
            } else {
                ShopCart.findOneAndUpdate(
                    //filter
                    {_id: shopCartId},
                    //what we update
                    {$set: shopCart},
                    //options. returns new updated data
                    {new: true, runValidators: true},
                )
                    .then(cart => res.status(200).json(cart))
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
                        message: `update shop cart - Error happened on server: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteShopCartById = (req, res, next) => {
    ShopCart
        .findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(200)
                .json({
                    message: `Shop cart with id "${req.params.id}" is deleted`,
                });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete shop cart error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteAllShopCarts = (req, res, next) => {

    ShopCart.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all shop cart data are deleted',
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete shop carts error "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};


