import fs from 'fs';
import path from 'path';
import {getRandomInt, log} from '../utils/helper';
import Brand from '../models/schemas/Brand';
import Color from '../models/schemas/Color';
import Size from '../models/schemas/Size';
import SizeTable from '../models/schemas/SizeTable';
import Quantity from '../models/schemas/Quantity';
import moment from 'moment';
import Category from '../models/schemas/Category';
import Product from '../models/schemas/Product';
import mongoose from 'mongoose';
import config from '../../src/config/index';

export const importData = (req, res, next) => {
    let startTime = new Date();
    let start = new Date();

    const filePath = req.file ? req.file.path : null;

    if (!filePath) {
        res.status(400)
            .json({
                message: `import data error: json file is required`,
            });
        next();
        return;
    }

    getImportedProductData(filePath, async (err, products) => {
        if (err) {
            res.status(400)
                .json({
                    message: `import data error: ${err.message}`,
                });
            log(err);
            next(err);
        } else if (!products.length) {
            res.status(400)
                .json({
                    message: `import data error: empty json file`,
                });
            next();
        }

        const errorHandler = (error) => {
            res.status(400)
                .json({
                    message: `Error happened on server: "${error.message}" `,
                });
            log(error);
            next(error);
        };

        const brands = new Set();
        const sizeTables = new Map();
        const categoryHierarchy = new Map();
        const allColorsToImport = new Map();

        products.map(product => {
            if (product.brand) brands.add(product.brand.trim().toLowerCase());
            if (product.sizeTable) sizeTables.set(product.sizeType, product.sizeTable);

            const color = product.color;
            if (color) allColorsToImport.set(color.name.trim().toLowerCase(), color.baseColorName.trim().toLowerCase());

            const categoriesList = product.categoryBreadcrumbs.split('/');
            fillCategories(categoriesList, categoryHierarchy);

            addBaseImageUrl(product);
        });

        const categories = Array.from(categoryHierarchy);

        categories.sort((current, next) => {
            return current[1].key - next[1].key;
        });

        const importColorsPr = importColors(allColorsToImport, errorHandler);
        const importBrandsPr = importBrands(brands, errorHandler);
        const importCategoriesPr = importCategories(categoryHierarchy, errorHandler);
        const importSizesPr = importSizes(sizeTables, errorHandler);

        Promise
            .all([
                importColorsPr,
                importBrandsPr,
                importCategoriesPr,
                importSizesPr,
            ])
            .then(async (results) => {
                const {newColors = []} = results[0];
                const {newBrands = [], allBrands} = results[1];
                const {newCategories = [], allCategories} = results[2];
                const {newSizes = []} = results[3];

                const {newProducts = []} = await importProducts(products, allCategories, allBrands, errorHandler);
                console.log('products import time: ', (new Date() - startTime) / 1000, 's');
                startTime = new Date();

                const {newSizeTables = []} = await importSizeTables(products, errorHandler);
                console.log('size tables import time: ', (new Date() - startTime) / 1000, 's');
                startTime = new Date();

                const {newQuantity = []} = await importQuantity(products, errorHandler);
                console.log('quantity import time: ', (new Date() - startTime) / 1000, 's');
                startTime = new Date();

                console.log('total import time: ', (new Date() - start) / 1000, 's');

                res.status(200)
                    .json({
                        'added new brands': newBrands.length,
                        'added new colors': newColors.length,
                        'added new categories': newCategories.length,
                        'added new products': newProducts.length,
                        'added new sizes': newSizes.length,
                        'added new sizeTables': newSizeTables.length,
                        'added new quantity data': newQuantity.length,
                    });
            })
            .catch(e => {
                errorHandler(e);
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
};

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
            createdDate: moment.utc().format('MM-DD-YYYY'),
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
            element.level = element.key;
            categoryHierarchy.set(breadCrumbs, element);
        }
    }
};

const addBaseImageUrl = (product) => {
    const baseUlr = config.imageStorageBaseAddress;
    if (!baseUlr) throw new Error('imageStorageBaseAddress env variable is not specified');
    if (product.imageUrls) {
        product.imageUrls = product.imageUrls.map(imgAdr => baseUlr + imgAdr);
    }
    if (product.videoUrl) {
        product.videoUrl = baseUlr + product.videoUrl;
    }
};

const saveCategories = async (insertedValues) => {
    const rez = [];
    for (const newCategory of insertedValues) {
        newCategory.createdDate = moment.utc().format('MM-DD-YYYY');
        const category = await new Category(newCategory).save();
        rez.push(category);
    }
    return rez;
};

const saveColors = (insertedValues) => {
    const arr = insertedValues.map(newColor => {
        return {
            name: newColor[0],
            baseColorName: newColor[1],
            createdDate: moment.utc().format('MM-DD-YYYY'),
        };
    });

    return Color.insertMany(arr);
};

const saveSizes = (insertedValues) => {
    const arr = insertedValues.map(newSize => {
        return {
            ...newSize,
            createdDate: moment.utc().format('MM-DD-YYYY'),
        };
    });
    return Size.insertMany(arr);
};

const saveSizeTables = (insertedValues) => {
    const arr = insertedValues.map(newSizeTable => {
        return {
            ...newSizeTable,
            createdDate: moment.utc().format('MM-DD-YYYY'),
        };
    });
    return SizeTable.insertMany(arr);
};

const saveBrands = (insertedValues) => {
    const arr = insertedValues.map(newBrand => {
        return {
            name: newBrand,
            createdDate: moment.utc().format('MM-DD-YYYY'),
        };
    });
    return Brand.insertMany(arr);
};

const saveProducts = (insertedValues) => {
    const arr = insertedValues.map(newProduct => {
        return {
            ...newProduct,
            createdDate: moment.utc().format('MM-DD-YYYY'),
        };
    });
    return Product.insertMany(arr);
};

const saveQuantity = (insertedValues) => {
    const arr = insertedValues.map(newQuantityItem => {
        return {
            ...newQuantityItem,
            createdDate: moment.utc().format('MM-DD-YYYY'),
        };
    });

    return Quantity.insertMany(arr);
};


const importColors = (allColorsToImport, errorHandler) => {
    const colors = Array.from(allColorsToImport);

    return Color
        .find({}, {_id: 1, name: 1})
        .lean()
        .then(async (savedColors) => {
            let colorsToInsert = [];

            if (savedColors.length) {
                const savedColorNames = savedColors.map(c => c.name.trim().toLowerCase());
                colorsToInsert = colors.filter(cl => !savedColorNames.includes(cl[0]));
            } else {
                colorsToInsert = colors;
            }

            const newColors = await saveColors(colorsToInsert);
            const allColors = [].concat(savedColors).concat(newColors);

            return {
                newColors, allColors,
            };
        })
        .catch(error => {
            errorHandler(error);
        });
};

const importSizes = (importedSizeTables, errorHandler) => {
    const stbls = Array.from(importedSizeTables);

    const sizes = [];

    stbls.map(st => {
        const sizeType = st[0];
        const sizeTable = st[1];
        sizeTable.map(s => {
            const allSizeNames = Object.getOwnPropertyNames(s);
            allSizeNames.map(sizeName => {
                if (sizeName.toLowerCase() !== 'quantity') {
                    sizes.push({
                        name: sizeName,
                        sizeType: sizeType,
                    });
                }
            });
        });
    });

    return Size
        .find({}, {_id: 1, sizeTypeSizeName: 1})
        .lean()
        .then(async (savedSizes) => {
            let sizesToInsert = [];

            if (savedSizes.length) {
                const sizeTypeSizeNames = savedSizes.map(s => s.sizeTypeSizeName);
                sizesToInsert = sizes.filter(s => !sizeTypeSizeNames.includes(`${s.sizeType}/${s.name}`.toLowerCase()));
            } else {
                sizesToInsert = sizes;
            }

            try {
                const newSizes = await saveSizes(sizesToInsert);
                const allSizes = [].concat(newSizes).concat(savedSizes);

                return {
                    newSizes, allSizes,
                };
            } catch (error) {
                errorHandler(error);
            }
        })
        .catch(error => {
            errorHandler(error);
        });
};

const importBrands = (allBrandsToImport, errorHandler) => {
    const brArr = Array.from(allBrandsToImport);

    return Brand
        .find({}, {name: 1})
        .lean()
        .then(async (savedBrands) => {
            let brandsToInsert = [];

            if (savedBrands.length) {
                const savedBrandNames = savedBrands.map(b => b.name.trim().toLowerCase());
                brandsToInsert = brArr.filter(br => !savedBrandNames.includes(br));
            } else {
                brandsToInsert = brArr;
            }

            const newBrands = await saveBrands(brandsToInsert);
            const allBrands = [].concat(savedBrands).concat(newBrands);

            return {
                newBrands, allBrands,
            };
        })
        .catch(error => {
            errorHandler(error);
        });
};

const importCategories = async (allCategoriesToImport, errorHandler) => {
    const categories = Array.from(allCategoriesToImport);

    return Category
        .find({}, {_id: 1, categoryBreadcrumbs: 1})
        .lean()
        .then(async (savedCategories) => {


            const categoriesHierarchy = categories.map(category => {
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
                    });
                }
                return categoryData;
            });

            const saved = savedCategories.map(sc => sc.categoryBreadcrumbs);
            const categoriesToInsert = categoriesHierarchy
                .filter(category => !saved.includes(category.categoryBreadcrumbs));

            const newCategories = await saveCategories(categoriesToInsert);
            const allCategories = [].concat(savedCategories).concat(newCategories);
            return {
                newCategories, allCategories,
            };
        })
        .catch(error => {
            errorHandler(error);
        });
};

const importProducts = (productsToImport, allCategories, allBrands, errorHandler) => {

    return Product.find({})
        .then(async (savedProducts) => {
            const newProducts = [];
            const savedProductsId = savedProducts.map(pr => pr.productId);


            const newToInsert = productsToImport
                .filter((product) => !savedProductsId.includes(product.productId));

            for (const newProduct of newToInsert) {

                const productBrand = newProduct.brand.trim().toLowerCase();
                const brand = allBrands.find(br => br.name === productBrand);
                newProduct.brandId = brand ? brand._id.toString() : null;

                const categoryBreadcrumbs = newProduct.categoryBreadcrumbs.trim().toLowerCase();
                const category = allCategories.find(cat => cat.categoryBreadcrumbs === `${categoryBreadcrumbs}/`);
                newProduct.categoryId = category ? category._id.toString() : null;

                newProduct.createdDate = moment.utc().format('MM-DD-YYYY');
                newProduct.isOnSale = newProduct.salePrice >= 0 && newProduct.salePrice < newProduct.price;
                newProduct.rating = getRandomInt(0, 5);

                newProducts.push(newProduct);
            }

            const rez = await saveProducts(newProducts);
            return {
                newProducts: rez,
                allProducts: savedProducts,
            };
        })
        .catch(error => {
            errorHandler(error);
        });
};

const importSizeTables = async (products, errorHandler) => {

    return Product.find({})
        .then(async (savedProducts) => {
            const savedSizes = await Size.find({});

            const sizeTablesData = [];
            products.map(product => {
                const sizeType = product.sizeType;
                const sizeTable = product.sizeTable; // is Array of objects
                const productDB = savedProducts.find(pr => pr.productId === product.productId);
                const productId = productDB ? productDB._id.toString() : null;
                let sizeId = null;

                sizeTable.map(s => {
                    const allSizeNames = Object.getOwnPropertyNames(s);
                    allSizeNames.map(sizeName => {
                        // sizeName =>>>>> "4"
                        const searchSize = `${sizeType}/${sizeName}`;

                        if (sizeName.toLowerCase() !== 'quantity') {
                            const size = savedSizes.find(as => {
                                const isEqual = as.sizeTypeSizeName === searchSize;
                                return isEqual;
                            });
                            sizeId = size ? size._id.toString() : null;
                            const measurementsData = s[sizeName]; // objects with props

                            const item = Object.assign({
                                productId,
                                sizeId,
                            }, measurementsData);
                            sizeTablesData.push(item);
                        }
                    });
                });
            });

            try {
                const newSizeTables = await saveSizeTables(sizeTablesData);

                return {
                    newSizeTables,
                };
            } catch (e) {
                errorHandler(e);
            }

        })
        .catch(error => {
            errorHandler(error);
        });
};

const importQuantity = async (products, errorHandler) => {

    return Product.find({})
        .then(async (savedProducts) => {

            const newQuantityData = [];

            const savedSizes = await Size.find({});
            const colors = await Color.find({});

            products.map(product => {
                const sizeType = product.sizeType;
                const sizeTable = product.sizeTable;
                const productDB = savedProducts.find(pr => pr.productId === product.productId);
                const productId = productDB ? productDB._id.toString() : null;
                let sizeId = null, quantity = null;

                const productColor = product.color;
                const productBaseColorStr = `${productColor.name}/${productColor.baseColorName}`;
                const color = colors.find(c => {
                    const colorBaseStr = `${c.name}/${c.baseColorName}`;
                    return colorBaseStr === productBaseColorStr;
                });
                const colorId = color ? color._id.toString() : null;

                sizeTable.map(s => {
                    const allSizeNames = Object.getOwnPropertyNames(s);
                    quantity = s.quantity;
                    allSizeNames.map(sizeName => {
                        if (sizeName.toLowerCase() === 'quantity') return;
                        const size = savedSizes.find(as => as.sizeTypeSizeName === `${sizeType}/${sizeName}`);
                        sizeId = size ? size._id.toString() : null;

                        const item = {
                            productId: productId,
                            colorId: colorId,
                            sizeId,
                            quantity,
                        };

                        newQuantityData.push(item);
                    });
                });
            });


            const rez = await saveQuantity(newQuantityData);
            return {
                newQuantity: rez,
            };
        })
        .catch(error => {
            errorHandler(error);
        });
};