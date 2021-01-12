import mongoose, { Schema } from 'mongoose';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import schemaOptions from '../schemaOptions';
import config from '../../config';
import { log } from '../../helpers/helper';

const ProductSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  special: {
    type: Boolean,
    default: false,
  },
  bestseller: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
  },

  productId: {
    type: Number,
    required: [true, 'for a product must be specified'],
  },
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'is required'],
  },
  description: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'is required'],
  },
  price: {
    required: [true, 'is required'],
    type: Number,
  },
  manufacturerCountry: {
    type: String,
    lowercase: true,
    trim: true,
  },
  imageUrls: [{
    required: [true, 'imageUrl is required'],
    type: String,
  },
  ],
  videoUrl: {
    type: String,
  },
  materials: {
    type: String,
  },
  salePrice: {
    type: Number,
  },
  isOnSale: {
    type: Boolean,
    default: false,
  },

  createdDate: {
    type: Date,
  },
  updatedDate: {
    type: Date,
  },

  brandId: {
    type: mongoose.ObjectId,
    ref: 'brands',
    default: null,
    autopopulate: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'categories',
    required: [true, 'for a product must be specified'],
    autopopulate: true,
  },
},
schemaOptions);

ProductSchema.index({ '$**': 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ salePrice: 1 });
ProductSchema.index({ salePrice: -1 });

ProductSchema.index({ createdDate: 1 });
ProductSchema.index({ createdDate: -1 });

ProductSchema.index({ manufacturerCountry: 1 });
ProductSchema.index({ rating: 1 });

// for banners index
ProductSchema.index({ bestseller: 1 });
ProductSchema.index({ isOnSale: 1 });
ProductSchema.index({ special: 1 });
ProductSchema.index({ categoryId: 1 });

ProductSchema.index({ categoryId: 1, createdDate: -1 });
ProductSchema.index({ categoryId: 1, salePrice: -1 });
ProductSchema.index({ categoryId: 1, salePrice: 1 });
ProductSchema.index({ categoryId: 1, salePrice: -1, price: 1 });
ProductSchema.index({
  _id: 1, categoryId: 1, salePrice: -1, price: 1,
});

ProductSchema.index({ isOnSale: 1, createdDate: -1 });

// eslint-disable-next-line func-names
const setStartTime = function () {
  if (config.productDebugMode) {
    this._startTime = Date.now();
  }
};

// eslint-disable-next-line func-names
const logDebugInfo = function () {
  if (config.productDebugMode) {
    if (this._startTime != null) {
      const query = JSON.stringify(this.getQuery());
      const options = JSON.stringify(this.getOptions());
      const duration = (new Date() - this._startTime) / 1000;
      log(`Product select time:  ${duration} s`);
      log(`Product select filters:  ${query}`);
      log(`Product select options: ${options}`);
      log(Array(100).join('_'));
    }
  }
};

// eslint-disable-next-line func-names
const productIdValidator = async function (next) {
  if (this.productId) {
    const pr = await this.constructor.findOne({ productId: this.productId }, { _id: 1 }).lean();
    if (pr) {
      next(new TypeError(`product with productId: ${this.productId} already exists`));
      return false;
    }
  }

  if (!this.productId) {
    const lastAddedProduct = await this.constructor.findOne({}, { productId: 1 })
      .sort('-productId')
      .lean();

    this.productId = lastAddedProduct ? lastAddedProduct.productId + 1 : 1;
    next();
  }

  return true;
};

ProductSchema.pre('validate', productIdValidator);

ProductSchema.pre('find', setStartTime);
ProductSchema.post('find', logDebugInfo);

ProductSchema.plugin(validator);
ProductSchema.plugin(autoPopulate);

export default mongoose.model('products', ProductSchema);
