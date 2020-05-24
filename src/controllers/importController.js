import fs from 'fs';
import path from 'path';
import {log} from "../utils/helper";
import Brand from "../models/Brand";
import moment from "moment";
import Category from "../models/Category";
import Product from "../models/Product";
import mongoose from 'mongoose';
// import config from '../../src/config/index';

export const importData = (req, res, next) => {
    const filePath = req.file ? req.file.path : null;

    if (!filePath) {
        res.status(400)
            .json({
                message: `import data error: json file is required`
            });
        next();
        return;
    }

    getImportedProductData(filePath, function (err, products) {
        if (err) {
            res.status(400)
                .json({
                    message: `import data error: ${err.message}`
                });
            log(err);
            next(err);
        }
        if (!products.length) {
            res.status(400)
                .json({
                    message: `import data error: empty json file`
                });
            next();
        }


        const brands = new Set();
        const categoryHierarchy = new Map();

        products.map(product => {
            if (product.brand) brands.add(product.brand.trim().toLowerCase());
            const categoriesList = product.categoryBreadcrumbs.split("/");
            fillCategories(categoriesList, categoryHierarchy);
            // todo more universal will be save just folder structure
            // and add base url when get data request performs?
            //addBaseImageUrl(product);
        });

        let allBrands = [];
        let allCategories = [];
        const brArr = Array.from(brands);
        const categories = Array.from(categoryHierarchy);

        categories.sort((current, next) => {
            return current[1].key - next[1].key;
        });

        let newBrands = [];

        Brand
            .find({name: {$in: brArr}})
            .then(savedBrands => {
                const savedBrandNames = savedBrands.map(b => b.name.trim().toLowerCase());
                newBrands = brArr.filter(br => !savedBrandNames.includes(br));

                Brand.insertMany(newBrands.map(br => {
                    return {
                        name: br,
                        createdDate: moment.utc().format("MM-DD-YYYY")
                    }
                }), function (err, docs) {
                    if (err) {
                        res.status(400)
                            .json({
                                message: `new brands import error: ${err.message}`
                            });
                    }
                    allBrands = [].concat(savedBrands).concat(docs);
                });
            })
            .then(() => {

                Category
                    .find()
                    .then(savedCategories => {

                        // change parentId for already saved categories
                        const newCategories = categories.map(category => {
                            const sc = savedCategories.find(sc => sc.categoryBreadcrumbs === category[0]);
                            const categoryData = category[1];
                            const genId = categoryData._id;
                            if (sc) {
                                const savedId = sc._id.toString();
                                categoryData._id = savedId;
                                categories.map(cat => {
                                    if (cat[1].parentId === genId) {
                                        cat[1].parentId = savedId;
                                    }
                                })
                            }
                            return categoryData;
                        });

                        const saved = savedCategories.map(sc => sc.categoryBreadcrumbs);
                        const insertedValues = newCategories
                            .filter(category => !saved.includes(category.categoryBreadcrumbs));

                        saveCategories(insertedValues)
                            .then(rez => {
                                allCategories = [].concat(savedCategories).concat(rez);
                            })
                            .then(() => {
                                saveProducts(products, allCategories, allBrands, function (error, rez) {
                                    if (error) {
                                        res.status(400)
                                            .json({
                                                message: `products import error: ${error.message}`
                                            });
                                        log(error);
                                        next(error);
                                    }
                                    res.status(200)
                                        .json({
                                            "added new brands": newBrands.length,
                                            "added new categories": insertedValues.length,
                                            "added new products": rez.length
                                        });
                                }).catch(error => {
                                    res.status(400)
                                        .json({
                                            message: `Error happened on server: "${error.message}" `
                                        });
                                    log(error);
                                    next(error);
                                });
                            })
                            .catch(err => {
                                res.status(400)
                                    .json({
                                        message: `new categories import error: ${err.message}`
                                    });
                            });
                    })
                    .catch(error => {
                        res.status(400)
                            .json({
                                message: `Error happened on server: "${error.message}" `
                            });
                        log(error);
                        next(error);
                    });
            })
            .catch(error => {
                res.status(400)
                    .json({
                        message: `Error happened on server: "${error.message}" `
                    });
                log(error);
                next(error);
            });
    });

};

const getImportedProductData = (filePath, callback) => {
    try {
        // eslint-disable-next-line no-undef
        const jsonPath = path.join(__dirname, '..', '..', filePath);
        const data = fs.readFileSync(jsonPath);
        const products = JSON.parse(data);
        callback(null, products);
    } catch (err) {
        callback(err, []);
    }
}


const fillCategories = (categoriesList, categoryHierarchy) => {
    let breadCrumbs = '';

    for (let i = 0; i < categoriesList.length; i++) {
        const item = categoriesList[i].trim().toLowerCase();
        const prevItem = categoriesList[i - 1]
            ? categoriesList[i - 1].trim().toLowerCase()
            : null;

        const element = {
            _id: new mongoose.Types.ObjectId().toString(),
            name: item,
            key: i + 1,
            parentName: prevItem,
            createdDate: moment.utc().format("MM-DD-YYYY")
        };

        if (element.parentName) {
            const parentCategoryData = Array.from(categoryHierarchy).find((item) => {
                const parentCategory = item[1];
                return parentCategory.name === element.parentName
                    && parentCategory.categoryBreadcrumbs === breadCrumbs;
            });

            element.parentId = parentCategoryData[1]._id;
        }

        breadCrumbs += `${item}/`;

        element.categoryBreadcrumbs = breadCrumbs;
        const saved = categoryHierarchy.get(breadCrumbs);

        if (!saved) {
            categoryHierarchy.set(breadCrumbs, element)
        }
    }
}

// const addBaseImageUrl = (product) => {
//     const baseUlr = config.imageStorageBaseAddress;
//     if (!baseUlr) throw new Error('imageStorageBaseAddress env variable is not specified');
//     if (product.imageUrls) {
//         product.imageUrls = product.imageUrls.map(imgAdr => baseUlr + imgAdr);
//     }
// }

const saveCategories = async (insertedValues) => {
    const rez = [];
    for (const newCategory of insertedValues) {
        newCategory.createdDate = moment.utc().format("MM-DD-YYYY");
        const category = await new Category(newCategory).save();
        rez.push(category);
    }
    return rez;
}
const saveProducts = async (insertedValues, allCategories, allBrands, callback) => {
    const rez = [];

    const products = await Product.find({});
    const savedProducts = products.map(pr => pr.productId);

    const newProducts = insertedValues
        .filter((product) => !savedProducts.includes(product.productId));

    try {
        for (const newProduct of newProducts) {
            const productBrand = newProduct.brand.trim().toLowerCase();
            const categoryBreadcrumbs = newProduct.categoryBreadcrumbs.trim().toLowerCase();

            const brand = allBrands.find(br => br.name === productBrand);
            newProduct.brandId = brand ? brand._id.toString() : null;

            const category = allCategories.find(cat => cat.categoryBreadcrumbs === `${categoryBreadcrumbs}/`);
            newProduct.categoryId = category ? category._id.toString() : null;

            newProduct.createdDate = moment.utc().format("MM-DD-YYYY");

            const product = await new Product(newProduct).save();

            rez.push(product);
        }
        callback(null, rez);
    } catch (error) {
        callback(error, rez);
    }
}


