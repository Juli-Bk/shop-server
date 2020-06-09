import Product from '../models/schemas/Product';
import {log} from '../utils/helper';
import filterParamsHelper from '../utils/filterParamsHelper';
import moment from 'moment';
import Category from '../models/schemas/Category';

export const addProduct = (req, res, next) => {
    const filePath = req.files ? req.files.map(file => file.path) : [];

    const productData = {
        ...req.body,
        createdDate: moment.utc().format('MM-DD-YYYY'),
        imageUrls: filePath,
        isOnSale: req.body.salePrice >= 0 && req.body.salePrice < req.body.price,
    };

    const newProduct = new Product(productData);
    newProduct
        .save()
        .then(product => res
            .status(200)
            .json({
                message: 'Success operation. New product is added',
                product,
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `New product adding error: ${error}`,
                    });
                log(error);
                next(error);
            },
        );

};

export const getAllProducts = async (req, res, next) => {
    const perPage = Number(req.query.perPage);
    const startPage = Number(req.query.startPage);

    const sort = req.query.sort;
    const count = (await Product.find()).length;

    Product
        .find()
        .skip(startPage * perPage - perPage)
        .limit(perPage)
        .sort(sort)
        .then(products => {
            res.status(200).json({
                products,
                totalCount: count,
            });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting products error: ${error.message}`,
                    });
                log(error);
                next(error);
            },
        );
};

export const getProductById = (req, res, next) => {

    Product
        .findById(req.params.id)
        .then(product => {
            if (!product) {
                res.status(400)
                    .json({
                        message: `Product with id ${req.params.id} is not found`,
                    });
            } else {
                res.status(200).json(product);
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

export const updateProductById = (req, res, next) => {
    const productId = req.params.id;
    const filePath = req.files ? req.files.map(file => file.path) : [];

    const productData = filePath.length ?
        {
            ...req.body,
            imageUrls: filePath,
            isOnSale: req.body.salePrice >= 0 && req.body.salePrice < req.body.price,
        }
        : {
            ...req.body,
            isOnSale: req.body.salePrice >= 0 && req.body.salePrice < req.body.price,
        };

    productData.updatedDate = moment.utc().format('MM-DD-YYYY');

    Product
        .findOne({_id: productId})
        .then(product => {
            if (!product) {
                return res.status(400)
                    .json({message: `Product with id "${productId}" is not found.`});
            } else {
                Product.findOneAndUpdate(
                    //filter
                    {_id: productId},
                    //what we update
                    {$set: productData},
                    //options. returns new updated data
                    {new: true, runValidators: true},
                )
                    .then(product => res.status(200).json(product))
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
                        message: `update product - Error happened on server: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteProductById = (req, res, next) => {
    Product
        .findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(200)
                .json({
                    message: `Product with id "${req.params.id}" is deleted`,
                });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete product error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const deleteAllProducts = (req, res, next) => {

    Product.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: 'all products are deleted',
            }),
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete products error "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );
};

export const searchProducts = (req, res, next) => {
    const queryString = req.body.query;

    if (!queryString) {
        res.status(400)
            .json({message: 'Products: Search query string is empty'});
        return;
    }

    // Creating the array of key-words from taken string
    // and preparing that string for search
    const query = queryString
        .toLowerCase()
        .trim()
        .replace(/\s\s+/g, ' ')
        .split(' ')
        .join(' ');

    // For example,
    // to find all stores containing “java” or “shop” but not “coffee”, use the following:
    //{ $text: { $search: "java shop -coffee" } }
    Product
        .find({
            $text: {$search: query},
        })
        .then(matchedProducts => {
            res.status(200)
                .json({products: matchedProducts});
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `product search error: "${error.message}" `,
                    });
                log(error);
                next(error);
            },
        );

};

export const getProductsByFilterParams = async (req, res, next) => {
    const categoryId = req.query.categoryId;
    if (categoryId) {
        let filter = [];

        const categories = await Category.find();

        const findChildren = (id) => {
            return categories.filter((item => {
                const parentId = item.parentId;
                return parentId && (parentId.id.toString() === id);
            }));
        };

        const searchChildren = (arr) => {
            arr.forEach(el => {
                el.children = findChildren(el.id); // array of children
                if (el.children.length) {
                    searchChildren(el.children);
                    filter = [].concat(filter).concat(el.children.map(item => item.id));
                }
            });
        };

        categories.filter(el => el.id === categoryId)
            .map((category) => {
                category.children = findChildren(category.id); // array of children
                if (category.children.length) {
                    searchChildren(category.children);
                    filter = [].concat(filter).concat(category.children.map(item => item.id));
                } else {
                    filter.push(category.id);
                }
            });
        req.query.categoryId = filter.join(',');
    }

    const mongooseQuery = filterParamsHelper(req.query);
    const perPage = Number(req.query.perPage);
    const startPage = Number(req.query.startPage);
    const sort = req.query.sort;

    try {
        const products = await Product.find(mongooseQuery)
            .skip(startPage * perPage - perPage)
            .limit(perPage)
            .sort(sort);

        const productsQuantity = await Product.find(mongooseQuery);

        await res.status(200).json({products: products, totalCount: productsQuantity.length});
    } catch (err) {
        res.status(400).json({
            message: `filter products error: "${err.message}" `,
        });
        next(err);
    }
};
