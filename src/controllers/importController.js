import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  getRandomInt, log, trimAndLowerCase, getFormattedCurrentDate,
} from '../helpers/helper';
import Brand from '../models/schemas/Brand';
import Color from '../models/schemas/Color';
import Size from '../models/schemas/Size';
import SizeTable from '../models/schemas/SizeTable';
import Quantity from '../models/schemas/Quantity';
import Category from '../models/schemas/Category';
import Product from '../models/schemas/Product';
import config from '../config/index';
import WishList from '../models/schemas/WishList';
import ShopCart from '../models/schemas/ShopCart';

const getImportedProductData = (filePath) => {
  const __dirname = path.resolve();
  const jsonPath = path.join(__dirname, filePath);
  try {
    const data = fs.readFileSync(jsonPath);
    return { products: JSON.parse(data), error: null };
  } catch (e) {
    return { products: null, error: e };
  }
};

function getParentCategoryData(categoryHierarchy, element, breadCrumbs) {
  return Array.from(categoryHierarchy).find((el) => {
    const parentCategory = el[1];
    return parentCategory.name === element.parentName
        && parentCategory.categoryBreadcrumbs === breadCrumbs;
  });
}

const fillCategories = (categoriesList, categoryHierarchy) => {
  let breadCrumbs = '';

  for (let i = 0; i < categoriesList.length; i += 1) {
    const item = trimAndLowerCase(categoriesList[i]);
    const prevItem = categoriesList[i - 1]
      ? trimAndLowerCase(categoriesList[i - 1])
      : null;

    const category = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: item,
      key: i + 1,
      parentName: prevItem,
      createdDate: getFormattedCurrentDate(),
    };

    if (category.parentName) {
      const parent = getParentCategoryData(categoryHierarchy, category, breadCrumbs);
      category.parentId = parent[1]._id;
    }

    breadCrumbs += `${item}/`;

    category.categoryBreadcrumbs = breadCrumbs;
    const saved = categoryHierarchy.get(breadCrumbs);

    if (!saved) {
      category.level = category.key;
      categoryHierarchy.set(breadCrumbs, category);
    }
  }
};

const addBaseImageUrl = (product) => {
  const baseUlr = config.imageStorageBaseAddress;
  let imageUrls = null;
  let videoUrl = null;

  if (product.imageUrls) {
    imageUrls = product.imageUrls.map((imgAdr) => baseUlr + imgAdr);
  }

  if (product.videoUrl) {
    videoUrl = baseUlr + product.videoUrl;
  }

  return { imageUrls, videoUrl };
};

const saveCategories = async (insertedValues) => {
  const rez = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const newCategory of insertedValues) {
    newCategory.createdDate = getFormattedCurrentDate();

    // eslint-disable-next-line no-await-in-loop
    const category = await new Category(newCategory).save();
    rez.push(category);
  }

  return rez;
};

const saveColors = (insertedValues) => {
  const arr = insertedValues.map((newColor) => ({
    name: newColor[0],
    baseColorName: newColor[1],
    createdDate: getFormattedCurrentDate(),
  }));

  return Color.insertMany(arr);
};

const saveSizes = (insertedValues) => {
  const arr = insertedValues.map((newSize) => ({
    ...newSize,
    createdDate: getFormattedCurrentDate(),
  }));
  return Size.insertMany(arr);
};

const saveSizeTables = (insertedValues) => {
  const arr = insertedValues.map((newSizeTable) => ({
    ...newSizeTable,
    createdDate: getFormattedCurrentDate(),
  }));
  return SizeTable.insertMany(arr);
};

const saveBrands = (insertedValues) => {
  const arr = insertedValues.map((newBrand) => ({
    name: newBrand,
    createdDate: getFormattedCurrentDate(),
  }));
  return Brand.insertMany(arr);
};

const saveProducts = (insertedValues) => {
  const arr = insertedValues.map((newProduct) => ({
    ...newProduct,
    createdDate: getFormattedCurrentDate(),
  }));
  return Product.insertMany(arr);
};

const saveQuantity = (insertedValues) => {
  const arr = insertedValues.map((newQuantityItem) => ({
    ...newQuantityItem,
    createdDate: getFormattedCurrentDate(),
  }));

  return Quantity.insertMany(arr);
};

const importColors = async (colorsToImport, errorHandler) => {
  const colors = Array.from(colorsToImport);

  try {
    const savedColors = await Color.find({}, { _id: 1, name: 1 }).lean();
    let colorsToInsert;

    if (savedColors.length) {
      const savedColorNames = savedColors.map((c) => trimAndLowerCase(c.name));
      colorsToInsert = colors.filter((cl) => !savedColorNames.includes(cl[0]));
    } else {
      colorsToInsert = colors;
    }

    const newColors = await saveColors(colorsToInsert);
    const allColors = [].concat(savedColors).concat(newColors);

    return {
      newColors, allColors,
    };
  } catch (e) {
    errorHandler(e);
    return null;
  }
};

const getSizes = (data) => {
  const sizes = [];
  const importedSizeTables = Array.from(data);
  importedSizeTables.forEach((st) => {
    const sizeType = st[0];
    const sizeTable = st[1];

    sizeTable.forEach((s) => {
      const allSizeNames = Object.getOwnPropertyNames(s);
      allSizeNames.forEach((sizeName) => {
        if (trimAndLowerCase(sizeName) !== 'quantity') {
          sizes.push({
            name: sizeName,
            sizeType,
          });
        }
      });
    });
  });
  return sizes;
};

const getSizesToInsert = (data, savedSizes) => {
  const sizes = getSizes(data);
  let sizesToInsert;

  if (savedSizes.length) {
    const saved = savedSizes.map((s) => s.sizeTypeSizeName);
    sizesToInsert = sizes.filter((s) => {
      const searchStr = `${s.sizeType}/${s.name}`.toLowerCase();
      return !saved.includes(searchStr);
    });
  } else {
    sizesToInsert = sizes;
  }

  return sizesToInsert;
};

const importSizes = async (data, errorHandler) => {
  let newSizes = [];
  let allSizes = [];
  const savedSizes = await Size.find({}, { _id: 1, sizeTypeSizeName: 1 }).lean();
  const sizesToInsert = getSizesToInsert(data, savedSizes);

  try {
    newSizes = await saveSizes(sizesToInsert);
    allSizes = [].concat(newSizes).concat(savedSizes);
  } catch (error) {
    errorHandler(error);
  }

  return {
    newSizes, allSizes,
  };
};

const getBrandsToInsert = (data, savedBrands) => {
  let brandsToInsert;
  const brArr = Array.from(data);
  if (savedBrands.length) {
    const savedBrandNames = savedBrands.map((b) => trimAndLowerCase(b.name));
    brandsToInsert = brArr.filter((br) => !savedBrandNames.includes(br));
  } else {
    brandsToInsert = brArr;
  }

  return brandsToInsert;
};

const importBrands = async (data, errorHandler) => {
  let newBrands = [];
  let allBrands = [];
  const savedBrands = await Brand.find({}, { name: 1 }).lean();
  const brandsToInsert = getBrandsToInsert(data, savedBrands);

  try {
    newBrands = await saveBrands(brandsToInsert);
    allBrands = [].concat(savedBrands).concat(newBrands);
  } catch (error) {
    errorHandler(error);
  }

  return {
    newBrands, allBrands,
  };
};

const getCategoriesToInsert = (data, savedCategories) => {
  const categories = Array.from(data);

  const categoriesHierarchy = categories.map((category) => {
    const [name, categoryData] = category;
    const sc = savedCategories.find((el) => el.categoryBreadcrumbs === name);
    const genId = categoryData._id;
    if (sc) {
      const savedId = sc._id.toString();
      categoryData._id = savedId;
      categories.forEach((cat) => {
        const { parentId } = cat[1];
        if (parentId === genId) {
          // eslint-disable-next-line no-param-reassign
          cat[1].parentId = savedId;
        }
      });
    }

    return categoryData;
  });

  const saved = savedCategories.map((sc) => sc.categoryBreadcrumbs);
  return categoriesHierarchy
    .filter((category) => !saved.includes(category.categoryBreadcrumbs));
};

const importCategories = async (data, errorHandler) => {
  let newCategories = [];
  let allCategories = [];
  const saved = await Category.find({}, { _id: 1, categoryBreadcrumbs: 1 }).lean();
  const toInsert = getCategoriesToInsert(data, saved);

  try {
    newCategories = await saveCategories(toInsert);
    allCategories = [].concat(saved).concat(newCategories);
  } catch (e) {
    errorHandler(e);
  }

  return {
    newCategories, allCategories,
  };
};

const getProductsToInsert = (data, savedProducts, categories, brands) => {
  const savedProductsIds = savedProducts.map((pr) => pr.productId);
  const newToInsert = data.filter((product) => !savedProductsIds.includes(product.productId));

  return newToInsert.map((item) => {
    const newProduct = { ...item };
    const productBrand = trimAndLowerCase(newProduct.brand);
    const brand = brands.find((br) => br.name === productBrand);
    newProduct.brandId = brand ? brand._id.toString() : null;

    const categoryBreadcrumbs = trimAndLowerCase(newProduct.categoryBreadcrumbs);
    const category = categories
      .find((cat) => cat.categoryBreadcrumbs === `${categoryBreadcrumbs}/`);
    newProduct.categoryId = category ? category._id.toString() : null;

    newProduct.createdDate = getFormattedCurrentDate();
    newProduct.isOnSale = newProduct.salePrice >= 0 && newProduct.salePrice < newProduct.price;
    newProduct.rating = getRandomInt(0, 5);

    return newProduct;
  });
};

const importProducts = async (productsToImport, categories, brands, errorHandler) => {
  const saved = await Product.find({});
  const productsToInsert = getProductsToInsert(productsToImport, saved, categories, brands);
  let newProducts = [];

  try {
    newProducts = await saveProducts(productsToInsert);
  } catch (e) {
    errorHandler(e);
  }

  return {
    newProducts,
    allProducts: [].concat(saved).concat(newProducts),
  };
};

const getSavedProductId = (savedProducts, product) => {
  const savedProduct = savedProducts.find((pr) => pr.productId === product.productId);
  return savedProduct ? savedProduct._id.toString() : null;
};

const getSavedSizeId = (savedSizes, sizeType, sizeName) => {
  const searchSize = `${sizeType}/${sizeName}`;
  const size = savedSizes.find((as) => as.sizeTypeSizeName === searchSize);
  return size ? size._id.toString() : null;
};

const getSavedColorId = (colors, product) => {
  const productColor = product.color;
  const productBaseColorStr = `${productColor.name}/${productColor.baseColorName}`;
  const color = colors.find((c) => {
    const colorBaseStr = `${c.name}/${c.baseColorName}`;
    return colorBaseStr === productBaseColorStr;
  });
  return color ? color._id.toString() : null;
};

const getSizeTablesToInsert = async (products) => {
  const savedProducts = await Product.find({});
  const savedSizes = await Size.find({});
  const sizeTablesData = [];

  products.forEach((product) => {
    const { sizeType, sizeTable } = product;
    const productId = getSavedProductId(savedProducts, product);
    let sizeId = null;

    sizeTable.forEach((table) => {
      const allSizeNames = Object.getOwnPropertyNames(table);
      allSizeNames.forEach((sizeName) => {
        if (sizeName.toLowerCase() !== 'quantity') {
          sizeId = getSavedSizeId(savedSizes, sizeType, sizeName);
          const measurementsData = table[sizeName];
          const item = {
            productId,
            sizeId,
            ...measurementsData,
          };
          sizeTablesData.push(item);
        }
      });
    });
  });
  return sizeTablesData;
};

const importSizeTables = async (products, errorHandler) => {
  let newSizeTables = [];
  const sizeTablesData = await getSizeTablesToInsert(products);
  log(`size tables: ${sizeTablesData.length}`);
  try {
    newSizeTables = await saveSizeTables(sizeTablesData);
  } catch (e) {
    errorHandler(e);
  }

  return {
    newSizeTables,
  };
};

const getQuantityToInsert = async (products) => {
  const quantityToInsert = [];
  const savedProducts = await Product.find({});
  const savedSizes = await Size.find({});
  const colors = await Color.find({});

  products.forEach((product) => {
    const { sizeType, sizeTable } = product;
    const productId = getSavedProductId(savedProducts, product);
    const colorId = getSavedColorId(colors, product);

    sizeTable.forEach((s) => {
      const allSizeNames = Object.getOwnPropertyNames(s);
      allSizeNames.forEach((sizeName) => {
        if (sizeName.toLowerCase() === 'quantity') return;
        const sizeId = getSavedSizeId(savedSizes, sizeType, sizeName);

        const item = {
          productId,
          colorId,
          sizeId,
          quantity: s.quantity || null,
        };
        quantityToInsert.push(item);
      });
    });
  });

  return quantityToInsert;
};

const importQuantity = async (products, errorHandler) => {
  const quantityToInsert = await getQuantityToInsert(products);
  log(`quantities: ${quantityToInsert.length}`);
  let newQuantity = [];

  try {
    newQuantity = await saveQuantity(quantityToInsert);
  } catch (e) {
    errorHandler(e);
  }

  return {
    newQuantity,
  };
};

const runImport = async (products) => {
  const errorHandler = (error) => {
    log(`error handler: ${error.message}`);
  };

  const brands = new Set();
  const sizeTableTypes = new Map();
  const categoryHierarchy = new Map();
  const allColorsToImport = new Map();

  const productsToSave = products.map((product) => {
    const productItem = { ...product };
    if (productItem.brand) brands.add(trimAndLowerCase(productItem.brand));
    if (productItem.sizeTable) sizeTableTypes.set(productItem.sizeType, product.sizeTable);

    const { color } = productItem;
    if (color) {
      const { name, baseColorName } = color;
      allColorsToImport.set(trimAndLowerCase(name), trimAndLowerCase(baseColorName));
    }

    const categoriesList = productItem.categoryBreadcrumbs.split('/');
    fillCategories(categoriesList, categoryHierarchy);

    const { imageUrls, videoUrl } = addBaseImageUrl(productItem);
    if (imageUrls) {
      productItem.imageUrls = imageUrls;
    }

    if (videoUrl) {
      productItem.videoUrl = videoUrl;
    }

    return productItem;
  });

  const categories = Array.from(categoryHierarchy);
  categories.sort((current,
    nextCategory) => current[1].key - nextCategory[1].key);

  const results = await Promise.all([
    importColors(allColorsToImport, errorHandler),
    importBrands(brands, errorHandler),
    importCategories(categoryHierarchy, errorHandler),
    importSizes(sizeTableTypes, errorHandler),
  ]);

  const { newColors = [] } = results[0];
  const { newBrands = [], allBrands } = results[1];
  const { newCategories = [], allCategories } = results[2];
  const { newSizes = [] } = results[3];

  const jsonData = [productsToSave, allCategories, allBrands, errorHandler];

  const { newProducts = [] } = await importProducts(...jsonData);
  const { newSizeTables = [] } = await importSizeTables(productsToSave, errorHandler);
  const { newQuantity = [] } = await importQuantity(productsToSave, errorHandler);

  return {
    newColors,
    newBrands,
    newCategories,
    newSizes,
    newProducts,
    newSizeTables,
    newQuantity,
  };
};

const clearData = () => Promise.all([
  Product.deleteMany({}),
  Brand.deleteMany({}),
  Color.deleteMany({}),
  Category.deleteMany({}),
  Size.deleteMany({}),
  SizeTable.deleteMany({}),
  Quantity.deleteMany({}),
  WishList.deleteMany({}),
  ShopCart.deleteMany({}),
]);

const importData = async (req, res, next) => {
  const filePath = req.file ? req.file.path : null;

  if (!filePath) {
    return res.status(400)
      .json({
        message: 'import data error: json file is required',
      });
  }

  try {
    if (config.clearDataBeforeImport) {
      await clearData();
    }

    const { products, error } = getImportedProductData(filePath);

    if (error) {
      return res.status(400).json({
        message: `import data error: ${error.message}`,
      });
    }

    if (!products.length) {
      return res.status(400).json({
        message: 'import data error: empty json file',
      });
    }

    try {
      const importResults = await runImport(products);
      const {
        newBrands, newColors,
        newCategories, newProducts,
        newSizes, newSizeTables,
        newQuantity,
      } = importResults;

      return res.status(200).json({
        'added new brands': newBrands.length,
        'added new colors': newColors.length,
        'added new categories': newCategories.length,
        'added new products': newProducts.length,
        'added new sizes': newSizes.length,
        'added new sizeTables': newSizeTables.length,
        'added new quantity data': newQuantity.length,
      });
    } catch (e) {
      log(e.message);
      next(e);
      return res.status(400).json({
        message: `import data error: ${e.message}`,
      });
    }
  } catch (e) {
    log(e.message);
    next(e);
    return res.status(400).json({
      message: `import data error: ${e.message}`,
    });
  }
};

export const initialImport = async (filePath) => {
  if (!filePath) {
    throw new Error('empty filePath for initial import');
  }

  if (config.clearDataBeforeImport) {
    await clearData();
  }

  const { products, error } = getImportedProductData(filePath);

  if (error) {
    throw new Error(`import data error: ${error.message}`);
  }

  if (!products.length) {
    throw new Error('import data error: empty json file');
  }

  try {
    const importResults = await runImport(products);
    const {
      newBrands, newColors,
      newCategories, newProducts,
      newSizes, newSizeTables,
      newQuantity,
    } = importResults;

    log(JSON.stringify({
      'added new brands': newBrands.length,
      'added new colors': newColors.length,
      'added new categories': newCategories.length,
      'added new products': newProducts.length,
      'added new sizes': newSizes.length,
      'added new sizeTables': newSizeTables.length,
      'added new quantity data': newQuantity.length,
    }));
  } catch (e) {
    log(`import data error: ${e.message}`);
  }
};

export default importData;
