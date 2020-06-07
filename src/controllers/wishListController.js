import WishList from '../models/schemas/WishList';
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
                                    message: `New wish adding error: ${error.message}`
                                });
                            log(error);
                            next(error);
                        }
                    );
            } else {
                const wishes = userWishes[0];
                const products = wishes.products.map(pr => pr._id.toString());
                if (products.includes(productId)) {
                    res.status(200)
                        .json({
                            message: 'Success operation. The product is already in your wishList',
                            wishes
                        });
                } else {
                    products.push(productId);

                    WishList.findOneAndUpdate(
                        {userId: userId},
                        {
                            $set: {
                                userId: userId,
                                products: products
                            }
                        },
                        {new: true, runValidators: true}
                    ).then(() => res
                        .status(200)
                        .json({
                            message: 'Success operation. New wish is added'
                        })
                    )
                        .catch(error => {
                                res.status(400)
                                    .json({
                                        message: `New wish adding error: ${error.message}`
                                    });
                                log(error);
                                next(error);
                            }
                        );
                }
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
                        message: `Getting wishes error: ${error.message}`
                    });
                next(error);
            }
        );
};

export const getUserWishes = (req, res, next) => {
    const userId = req.params.id;

    WishList.find({userId: userId})
        .then(userWishList => {
            return res.status(200)
                .send({userWishList});
        })
        .catch(error => {
            res.status(400)
                .json({
                    message: `Getting user wishes error: ${error.message}`
                });
            next(error);
        });
};

export const deleteProductFromWishlist = (req, res, next) => {
    const productId = req.params.id;
    const userId = req.user.id;

    WishList.find({userId: userId})
        .then((userWishes) => {
            if (!userWishes.length) {
                res.status(400)
                    .json({
                        message: `user has no wish list yet`
                    });
            } else if (!userWishes[0].products.length) {
                res.status(400)
                    .json({
                        message: `user ${userId} has no product ${productId} in wishList`
                    });
            } else {
                const wishes = userWishes[0];
                const products = wishes.products.map(pr => pr._id.toString());
                if (!products.includes(productId)) {
                    res.status(400)
                        .json({
                            message: `user ${userId} has no product ${productId} in wishList`
                        });
                } else {

                    const newProductList = wishes.products
                        .filter(pr => pr._id.toString() !== productId)
                        .map(pr => pr._id.toString());

                    WishList.findOneAndUpdate(
                        {userId: userId},
                        {
                            $set: {
                                userId: userId,
                                products: newProductList
                            }
                        },
                        {new: true, runValidators: true}
                    ).then(() => res
                        .status(200)
                        .json({
                            message: 'Success operation. Product is deleted from wishlist'
                        })
                    )
                        .catch(error => {
                                res.status(400)
                                    .json({
                                        message: `Wish list error: ${error.message}`
                                    });
                                log(error);
                                next(error);
                            }
                        );
                }
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
