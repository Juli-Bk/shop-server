import WishList from '../models/WishList';
import {log} from '../utils/helper';

export const addProductToWishList = (req, res, next) => {
    const {productId, userId} = req.body;

    if (!productId) {
        res.status(400)
            .json({
                message: `add product to wish list error: productId parameter is required" `
            });
    }

    if (!userId) {
        res.status(400)
            .json({
                message: `add product to wish list error: userId parameter is required" `
            });
    }


    WishList.find({userId: userId})
        .then((userWishes) => {
            if (!userWishes.length) {
                const newWish = new WishList({
                    userId: userId,
                    products: [productId]
                });

                newWish
                    .save()
                    .then(() => res
                        .status(200)
                        .json({
                            message: 'Success operation. New wish is added'
                        })
                    )
                    .catch(error => {
                            res.status(400)
                                .json({
                                    message: `New wish adding error: ${error}`
                                });
                            log(error);
                            next(error);
                        }
                    );
            } else {
                const wishes = userWishes[0];
                wishes.products.push(productId);
                wishes.save()
                    .then(() => res
                        .status(200)
                        .json({
                            message: 'Success operation. New wish is added'
                        })
                    )
                    .catch(error => {
                            res.status(400)
                                .json({
                                    message: `New wish adding error: ${error}`
                                });
                            log(error);
                            next(error);
                        }
                    );
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `add product to wish list error: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const getAllWishListData = (req, res, next) => {
    WishList
        .find()
        .then(items => {
                return res.status(200)
                    .send({items});
            }
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting wishes error: ${error}`
                    });
                next(error);
            }
        );
};

export const getUserWishes = (req, res, next) => {
    const userId = req.params.id;

    if (!userId) {
        res.status(400)
            .json({
                message: `getting user wish list error: userId parameter is required" `
            });
    } else {
        WishList.find({userId: userId})
            .then(items => {
                    return res.status(200)
                        .send({items});
                }
            )
            .catch(error => {
                    res.status(400)
                        .json({
                            message: `Getting user wishes error: ${error}`
                        });
                    next(error);
                }
            );
    }


};

export const deleteProductFromWishlist = (req, res, next) => {
    const productId = req.params.productId;
    const userId = req.params.userId;
    if (!productId) {
        res.status(400)
            .json({
                message: `delete product from wish list error: productId parameter is required" `
            });
    }

    if (!userId) {
        res.status(400)
            .json({
                message: `delete product from wish list error: userId parameter is required" `
            });
    }


    WishList.find({userIdd: userId})
        .then((userWishes) => {
            if (!userWishes) {
                res.status(400)
                    .json({
                        message: `user has no wish list yet`
                    });
            } else if (!userWishes.products.length) {
                res.status(400)
                    .json({
                        message: `user ${userId} has no product ${productId} in wishList`
                    });
            } else {
                const newProductList = userWishes.products.filter(product => product === productId);
                userWishes.products = newProductList;
                userWishes.save()
                    .then(() => res
                        .status(200)
                        .json({
                            message: 'Success operation. product is removed from wish list',
                        })
                    )
                    .catch(error => {
                            res.status(400)
                                .json({
                                    message: `product remove from wish list error: ${error.message}`
                                });
                            log(error);
                            next(error);
                        }
                    );
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete wish error: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const deleteAllWishes = (req, res, next) => {
    WishList.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all WishList data are deleted'
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete WishList data error "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};
