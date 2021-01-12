import mongoose, { Schema } from 'mongoose';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import schemaOptions from '../schemaOptions';
import { getRandomInt } from '../../helpers/helper';
import validationRules from '../../config/validation';

const statusList = ['processing', 'canceled', 'performed', 'shipping'];
const errorMsg = ` can be specified from this list: ${statusList.join(', ')}`;

const OrderSchema = new Schema(
  {
    orderNo: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      required: true,
      default: `${Date.now().toString()}-${getRandomInt(1, 1000)}`,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default: null,
      autopopulate: true,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'products',
          required: [true, 'must be specified'],
          autopopulate: true,
        },
        sizeId: {
          type: Schema.Types.ObjectId,
          ref: 'sizes',
          autopopulate: true,
        },
        colorId: {
          type: Schema.Types.ObjectId,
          ref: 'colors',
          autopopulate: true,
        },
        quantity: {
          type: Number,
          required: [true, 'must be specified'],
          min: 1,
        },
      },
    ],

    orderAsGuest: {
      type: Boolean,
      default: false,
    },
    userName: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, 'User name is required'],
    },
    deliveryAddress: {
      type: Schema.Types.Mixed,
      required: [true, 'Delivery address is required'],
    },
    shipping: {
      type: Schema.Types.Mixed,
      required: [true, 'Shipping method is required'],
    },
    paymentInfo: {
      type: Schema.Types.Mixed,
      required: [true, 'Payment method is required'],
    },
    liqPayPaymentStatus: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    liqPayInfo: {
      type: Schema.Types.Mixed,
    },
    totalSum: {
      type: Number,
      required: true,
    },
    canceled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      lowercase: true,
      trim: true,
      enum: {
        values: statusList,
        message: errorMsg,
      },
      default: statusList[0],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    orderComment: {
      type: String,
    },
    deliveryComfortTimeInterval: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, 'Phone number is required'],
      validate: {
        validator(phoneNumber) {
          return validationRules.phoneReExp.test(phoneNumber);
        },

        message: (props) => `${props.value} is not valid phone number`,
      },
    },
    createdDate: {
      type: Date,
    },
    updatedDate: {
      type: Date,
    },
  },
  schemaOptions,
);

// eslint-disable-next-line func-names
const checkOrderNumber = async function (next) {
  if (this.orderNo) {
    const pr = await this.constructor.findOne({ orderNo: this.orderNo }, { _id: 1 }).lean();
    if (pr) {
      this.orderNo = `${Date.now().toString()}-${getRandomInt(1, 1000)}`;
    }
  }

  next();
};

OrderSchema.pre('validate', checkOrderNumber);

OrderSchema.plugin(validator);
OrderSchema.plugin(autoPopulate);

export default mongoose.model('orders', OrderSchema);
