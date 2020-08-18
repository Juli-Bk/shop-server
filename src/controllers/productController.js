import Product from '../models/schemas/Product';
import {log} from '../utils/helper';
import filterParamsHelper, {validateObjectId} from '../utils/filterParamsHelper';
import moment from 'moment';
import Category from '../models/schemas/Category';
import Quantity from '../models/schemas/Quantity';


const productFieldsToSelect = {
    _id: 1, name: 1, description: 1,
    price: 1, rating: 1, salePrice: 1,
    isOnSale: 1, imageUrls: 1,
};

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
    const startTime = new Date();

    const perPage = Number(req.query.perPage);
    const startPage = Number(req.query.startPage);

    const sort = req.query.sort;
    const count = await Product.countDocuments();

    Product
        .find({}, productFieldsToSelect)
        .skip(startPage * perPage - perPage)
        .limit(perPage)
        .sort(sort)
        .lean()
        .then(products => {
            console.log('getAllProducts() time: ', (new Date() - startTime) / 1000, 's');
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
        .lean()
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
                    .lean()
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
        .lean()
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
        const startTime = new Date();

        const categoryId = req.query.categoryId;
        const colorsFilter = req.query.color; // silver,black,green
        const sizesFilter = req.query.size; // s,10,6.5,xl
        const isNewIn = req.query.new; // true

        if (categoryId) {
            let filter = [];

            const categories = await Category
                .find({}, {parentId: 1, _id: 1})
                .lean();

            const findChildren = (id) => {
                return categories.filter((item => {
                    const parentId = item.parentId;
                    return parentId && (parentId._id.toString() === id);
                }));
            };

            const searchChildren = (arr) => {
                arr.forEach(el => {
                    el.children = findChildren(el._id.toString()); // array of children
                    if (el.children.length) {
                        searchChildren(el.children);
                        filter = [].concat(filter).concat(el.children.map(item => item._id.toString()));
                    }
                });
            };

            categories.filter(el => el._id.toString() === categoryId)
                .map((category) => {
                    category.children = findChildren(category._id.toString()); // array of children
                    if (category.children.length) {
                        searchChildren(category.children);
                        filter = [].concat(filter).concat(category.children.map(item => item._id.toString()));
                    } else {
                        filter.push(category._id.toString());
                    }
                });
            if (filter.length === 0) {
                res.status(400).json({
                    message: `filter products error: "${categoryId}"  is not found in DB`,
                });
                return;
            } else {
                req.query.categoryId = filter.join(',');
            }
        }

        let inStock = [];
        if (colorsFilter || sizesFilter) {
            const filterObj = {
                quantity: {
                    $gt: 0,
                },
            };
            const quantities = await Quantity.find(filterObj);

            if (colorsFilter && sizesFilter) {
                const colorsList = colorsFilter.split(',');
                const sizesList = sizesFilter.split(',');
                inStock = new Set(quantities
                    .filter(item => {
                        const isOkByColor = item.colorId && colorsList.includes(item.colorId.baseColorName);
                        const isOkBySize = item.sizeId && sizesList.includes(item.sizeId.name);
                        return isOkByColor && isOkBySize;
                    })
                    .map(item => item.productId.toString()));
            } else if (colorsFilter) {
                const colorsList = colorsFilter.split(',');
                inStock = new Set(quantities
                    .filter(item => {
                        const isOkByColor = item.colorId && colorsList.includes(item.colorId.baseColorName);
                        return isOkByColor;
                    })
                    .map(item => item.productId.toString()));
            } else if (sizesFilter) {
                const sizesList = sizesFilter.split(',');
                inStock = new Set(quantities
                    .filter(item => {
                        const isOkBySize = item.sizeId && sizesList.includes(item.sizeId.name);
                        return isOkBySize;
                    })
                    .map(item => item.productId.toString()));
            }
        }
        const filterArr = Array.from(inStock);
        if (filterArr.length > 0) {
            let invalidId = '';
            const haveInvalidIdInFilters = filterArr.some(id => {
                const isValid = validateObjectId(id);
                if (!isValid) {
                    invalidId = id;
                }
                return !isValid;
            });

            if (haveInvalidIdInFilters) {
                return res.status(400).json({
                    message: `invalid filters: "${invalidId}" `,
                });
            } else {
                req.query._id = filterArr.join(',');
            }
        } else {
            if (req.query._id) {
                const ids = req.query._id.split(',');
                if (ids.length) {
                    let invalidId = '';
                    const haveInvalidIdInFilters = ids.some(id => {
                        const isValid = validateObjectId(id.trim());
                        if (!isValid) {
                            invalidId = id;
                        }
                        return !isValid;
                    });

                    if (haveInvalidIdInFilters) {
                        return res.status(400).json({
                            message: `invalid filter _id: "${invalidId}" `,
                        });
                    }
                } else {
                    if (!validateObjectId(req.query._id)) {
                        return res.status(400).json({
                            message: `invalid filter _id: ${req.query._id} `,
                        });
                    }
                }
            } else if ('_id' in req.query) {
                return res.status(400).json({
                    message: `filter _id can't be empty: ${req.query._id} `,
                });
            }
        }

        const mongooseQuery = filterParamsHelper(req.query);
        if (isNewIn) {
            const twoWeeksAgo = moment.utc().subtract(100, 'days').format('YYYY.MM.DD');
            const currentDate = moment.utc().format('YYYY.MM.DD');
            mongooseQuery.createdDate = {
                $gte: twoWeeksAgo,
                $lte: currentDate,
            };
        }
        const perPage = Number(req.query.perPage);
        const startPage = Number(req.query.startPage);
        const sort = req.query.sort;

        try {
            const products = await Product.find(mongooseQuery, productFieldsToSelect)
                .skip(startPage * perPage - perPage)
                .limit(perPage)
                .sort(sort)
                .lean();

            const totalCount = await Product.countDocuments(mongooseQuery);

            console.log('getProductsByFilterParams() time: ', (new Date() - startTime) / 1000, 's', 'filter obj: ', JSON.stringify(mongooseQuery));

            res.status(200).json({products, totalCount});
        } catch (err) {
            res.status(400).json({
                message: `filter products error: "${err.message}" `,
            });
            next(err);
        }
    }
;

export const getMaxPrice = (req, res, next) => {

    Product
        .find({}, {price: 1, salePrice: 1})
        .lean()
        .then(products => {
            const maxPrice = Math.max(...products.map(p => p.price));
            const maxSalePrice = Math.max(...products.map(p => p.salePrice));
            res.status(200).json({
                maxPrice,
                maxSalePrice,
            });
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `getMaxPrice error: ${error.message}`,
                    });
                log(error);
                next(error);
            },
        );
};
