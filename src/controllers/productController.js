import moment from 'moment';
import Product from '../models/schemas/Product';
import { log, getFormattedCurrentDate } from '../helpers/helper';
import filterParamsHelper, { validateObjectId } from '../helpers/filterParamsHelper';
import Category from '../models/schemas/Category';
import Quantity from '../models/schemas/Quantity';
import config from '../config';

const productFieldsToSelect = {
  _id: 1,
  name: 1,
  productId: 1,
  description: 1,
  price: 1,
  rating: 1,
  brandId: 1,
  salePrice: 1,
  isOnSale: 1,
  imageUrls: 1,
};

export const addProduct = async (req, res) => {
  const filePath = req.files ? req.files.map((file) => file.path) : [];

  const productData = {
    ...req.body,
    createdDate: getFormattedCurrentDate(),
    imageUrls: filePath,
    isOnSale: req.body.salePrice >= 0 && req.body.salePrice < req.body.price,
  };

  try {
    const product = await new Product(productData).save();
    return res.status(200).json({
      message: 'Success operation. New product is added',
      product,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `New product adding: ${error}`,
    });
  }
};

export const getAllProducts = async (req, res) => {
  const perPage = Math.abs(Number(req.query.perPage));
  const startPage = Math.abs(Number(req.query.startPage));

  const { sort } = req.query;

  try {
    const count = await Product.countDocuments();

    const products = await Product.find({}, productFieldsToSelect)
      .skip(startPage * perPage - perPage)
      .limit(perPage)
      .sort(sort)
      .lean()
      .populate('brandId', { name: 1, _id: 1 });
    return res.status(200).json({
      products,
      totalCount: count,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Getting products error: ${error.message}`,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(400).json({
        message: `Product with id ${req.params.id} is not found`,
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `Error happened on server: "${error.message}" `,
    });
  }
};

export const updateProductById = async (req, res) => {
  const productId = req.params.id;
  const filePath = req.files ? req.files.map((file) => file.path) : [];

  const productData = filePath.length
    ? {
      ...req.body,
      imageUrls: filePath,
      isOnSale: req.body.salePrice >= 0 && req.body.salePrice < req.body.price,
    }
    : {
      ...req.body,
      isOnSale: req.body.salePrice >= 0 && req.body.salePrice < req.body.price,
    };

  productData.updatedDate = getFormattedCurrentDate();

  try {
    const product = await Product.findOne({ _id: productId }).lean();
    if (!product) {
      return res.status(400).json({
        message: `Product with id "${productId}" is not found.`,
      });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { $set: productData },
      { new: true, runValidators: true },
    ).lean();

    return res.status(200).json({ product: updatedProduct });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `update product - Error happened on server: "${error.message}" `,
    });
  }
};

export const deleteProductById = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findByIdAndRemove(req.params.id);

    if (!product) {
      return res.status(400).json({
        message: `Product with id ${productId} is not found`,
      });
    }

    return res.status(200).json({
      message: `Product with id ${req.params.id} is deleted`,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete product error: ${error.message}`,
    });
  }
};

export const deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    return res.status(200).json({
      message: 'all products are deleted',
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `delete products error "${error.message}" `,
    });
  }
};

const prepareQueryString = (queryString) => {
  // Creating the array of key-words from taken string
  // and preparing that string for search
  // For example:
  // to find all stores containing “java” or “shop” but not “coffee”,
  // use the following:
  // { $text: { $search: "java shop -coffee" } }
  const filters = queryString
    .toLowerCase()
    .trim()
    .replace(/\s\s+/g, ' ')
    .split(' ');

  return filters.join(' ');
};

export const searchProducts = async (req, res) => {
  const queryString = req.body.query;

  if (!queryString) {
    return res.status(400).json({
      message: 'Products: Search query string is empty',
    });
  }

  try {
    const query = prepareQueryString(queryString);
    const products = await Product.find({
      $text: { $search: query },
    }).lean();

    return res.status(200).json({ products });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `product search error: "${error.message}" `,
    });
  }
};

const processCategoryFilter = async (categoryId) => {
  let filter = [];
  const categories = await Category.find({}, { parentId: 1, _id: 1 }).lean();

  const findChildren = (id) => categories.filter(((item) => {
    const { parentId } = item;
    return parentId && (parentId._id.toString() === id);
  }));

  const searchChildren = (arr) => {
    arr.map((el) => {
      // eslint-disable-next-line no-param-reassign
      el.children = findChildren(el._id.toString()); // array of children
      if (el.children.length) {
        searchChildren(el.children);
        filter = [].concat(filter).concat(el.children.map((item) => item._id.toString()));
      }

      return el;
    });
  };

  categories.filter((el) => el._id.toString() === categoryId)
    .map((category) => {
      // eslint-disable-next-line no-param-reassign
      category.children = findChildren(category._id.toString());
      if (category.children.length) {
        searchChildren(category.children);
        filter = [].concat(filter).concat(category.children.map((item) => item._id.toString()));
      } else {
        filter.push(category._id.toString());
      }

      return category;
    });

  return filter;
};

async function processColorAndSizeFilters(colorsFilter, sizesFilter) {
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
      inStock = new Set(quantities.filter((item) => {
        const isOkByColor = item.colorId && colorsList.includes(item.colorId.baseColorName);
        const isOkBySize = item.sizeId && sizesList.includes(item.sizeId.name);
        return isOkByColor && isOkBySize;
      }).map((item) => item.productId.toString()));
    } else if (colorsFilter) {
      const colorsList = colorsFilter.split(',');
      inStock = new Set(quantities
        .filter((item) => item.colorId && colorsList.includes(item.colorId.baseColorName))
        .map((item) => item.productId.toString()));
    } else if (sizesFilter) {
      const sizesList = sizesFilter.split(',');
      inStock = new Set(quantities
        .filter((item) => item.sizeId && sizesList.includes(item.sizeId.name))
        .map((item) => item.productId.toString()));
    }
  }

  return inStock;
}

const checkFilters = (filterArr) => filterArr.some((id) => {
  let invalidId = '';
  const isValid = validateObjectId(id.trim());
  if (!isValid) {
    invalidId = id;
  }

  return { isInvalid: !isValid, invalidId };
});

export const getProductsByFilterParams = async (req, res) => {
  const startTime = new Date();

  const { categoryId } = req.query;
  const colorsFilter = req.query.color; // silver,black,green
  const sizesFilter = req.query.size; // s,10,6.5,xl
  const isNewIn = req.query.new; // true

  if (categoryId && !validateObjectId(categoryId)) {
    return res.status(400).json({
      message: 'invalid category filter',
    });
  }

  if (categoryId) {
    try {
      const filter = await processCategoryFilter(categoryId);

      if (filter && filter.length === 0) {
        return res.status(400).json({
          message: `filter products error: category ${categoryId} is not found in DB`,
        });
      }

      req.query.categoryId = filter.join(',');
    } catch (error) {
      log(error);
      return res.status(400).json({
        message: `error on server: "${error}" `,
      });
    }
  }

  if ('_id' in req.query) {
    const { _id } = req.query;
    const ids = _id.split(',').filter((x) => validateObjectId(x));
    if (ids.length >= 1) {
      const { isInvalid, invalidId } = await checkFilters(ids);

      if (isInvalid) {
        return res.status(400).json({
          message: `invalid filter _id: ${invalidId}`,
        });
      }
    } else if (!validateObjectId(_id)) {
      return res.status(400).json({
        message: `invalid _id filter: ${_id}`,
      });
    }
  }

  const inStock = await processColorAndSizeFilters(colorsFilter, sizesFilter);

  const filterArr = Array.from(inStock);
  if (filterArr.length > 0) {
    const { isInvalid, invalidId } = await checkFilters(filterArr);

    if (isInvalid) {
      return res.status(400).json({
        message: `invalid filters: "${invalidId}" `,
      });
    }

    if ('_id' in req.query) {
      req.query._id = `${req.query._id},${filterArr.join(',')}`;
    } else {
      req.query._id = filterArr.join(',');
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
  const { sort } = req.query;

  try {
    const products = await Product.find(mongooseQuery, productFieldsToSelect)
      .skip(startPage * perPage - perPage)
      .limit(perPage)
      .sort(sort)
      .lean()
      .populate('brandId', { name: 1, _id: 1 });

    const totalCount = await Product.countDocuments(mongooseQuery);

    if (config.mongoDebugMode) {
      log(`getProductsByFilterParams() time: ${(new Date() - startTime) / 1000} s 
    filter obj: ${JSON.stringify(mongooseQuery)}`);
    }

    return res.status(200).json({ products, totalCount });
  } catch (err) {
    log(err);
    return res.status(400).json({
      message: `filter products error: "${err.message}" `,
    });
  }
};

export const getMaxPrice = async (req, res) => {
  try {
    const products = await Product
      .find({}, { price: 1, salePrice: 1 })
      .lean();
    const maxPrice = Math.max(...products.map((p) => p.price));
    const maxSalePrice = Math.max(...products.map((p) => p.salePrice));
    return res.status(200).json({
      maxPrice,
      maxSalePrice,
    });
  } catch (error) {
    log(error);
    return res.status(400).json({
      message: `getMaxPrice error: ${error.message}`,
    });
  }
};
