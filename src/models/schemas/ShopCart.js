import mongoose, { Schema } from 'mongoose';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import { getRandomItemId, getFormattedCurrentDate } from '../../helpers/helper';
import schemaOptions from '../schemaOptions';

const ShopCart = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  anonymousId: {
    type: String,
    default: getRandomItemId(),
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        required: [true, 'must be specified'],
      },
      sizeId: {
        type: Schema.Types.ObjectId,
        ref: 'sizes',
      },
      colorId: {
        type: Schema.Types.ObjectId,
        ref: 'colors',
      },
      cartQuantity: {
        type: Number,
        required: [true, 'must be specified'],
        min: 1,
      },
    },
  ],
  createdDate: {
    type: Date,
    default: getFormattedCurrentDate(),
  },
},
schemaOptions);

ShopCart.plugin(validator);
ShopCart.plugin(autoPopulate);

export default mongoose.model('shopcarts', ShopCart);
