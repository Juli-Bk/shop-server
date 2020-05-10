import Product from "../models/Product";
import {log} from "../utils/helper";
import filterParamsHelper from "../utils/filterParamsHelper"

export const addProduct = (req, res, next) => {
    const filePath = req.files ? req.files.map(file => file.path) : [];

    const productData = {
        ...req.body,
        imageUrls: filePath
    };

    const newProduct = new Product(productData);
    newProduct
        .save()
        .then(product => res
            .status(200)
            .json({
                message: "Success operation. New product is added",
                product
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `New product adding error: ${error}`
                    });
                log(error);
                next(error);
            }
        );

};

export const getAllProducts = (req, res, next) => {
    const perPage = Number(req.query.perPage);
    const startPage = Number(req.query.startPage);

    const sort = req.query.sort;

    Product
        .find()
        .skip(startPage * perPage - perPage)
        .limit(perPage)
        .sort(sort)
        .then(products => res.send(products))
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Getting products error: ${error}`
                    });
                log(error);
                next(error);
            }
        );
};

export const getProductById = (req, res, next) => {

    Product
        .findById(req.params.id)
        .then(product => {
            if (!product) {
                res.status(400)
                    .json({
                        message: `Product with id ${req.params.id} is not found`
                    });
            } else {
                res.status(200).json(product);
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `Error happened on server: "${error}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const updateProductById = (req, res, next) => {
    const productId = req.params.id;
    const filePath = req.files ? req.files.map(file => file.path) : [];

    const productData = filePath.length ?
        {
            ...req.body,
            imageUrls: filePath
        }
        : {...req.body};

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
                    {new: true}
                )
                    .then(product => res.json(product))
                    .catch(err =>
                        res.status(400).json({
                            message: `Error happened on server: "${err}" `
                        })
                    );
            }
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `update product - Error happened on server: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const deleteProductById = (req, res, next) => {
    Product
        .findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(200)
                .json({
                    message: `Product with id "${req.params.id}" is deleted`
                })
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete product error: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const deleteAllProducts = (req, res, next) => {

    Product.deleteMany({})
        .then(() => res.status(200)
            .json({
                message: "all products are deleted"
            })
        )
        .catch(error => {
                res.status(400)
                    .json({
                        message: `delete products error "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );
};

export const searchProducts = (req, res, next) => {
    log("searchProducts");
    const queryString = req.body.query;

    if (!queryString) {
        res.status(400)
            .json({message: "Products: Search query string is empty"});
        return;
    }

    // Creating the array of key-words from taken string
    // and preparing that string for search
    const query = queryString
        .toLowerCase()
        .trim()
        .replace(/\s\s+/g, " ")
        .split(" ")
        .join(" ");

    // For example,
    // to find all stores containing “java” or “shop” but not “coffee”, use the following:
    //{ $text: { $search: "java shop -coffee" } }
    Product
        .find({
            $text: {$search: query}
        })
        .then(matchedProducts => {
            res.status(200)
                .json(matchedProducts);
        })
        .catch(error => {
                res.status(400)
                    .json({
                        message: `product search error: "${error.message}" `
                    });
                log(error);
                next(error);
            }
        );


};

export const getProductsByFilterParams = async (req, res, next) => {
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

        await res.json({products, productsQuantity: productsQuantity.length});
    } catch (err) {
        res.status(400).json({
            message: `filter products error: "${err.message}" `
        });
        next(err);
    }
};


