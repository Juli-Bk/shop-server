import mongoose, {Schema} from 'mongoose';
import schemaOptions from '../modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import {getRandomInt} from '../../utils/helper';
import validationRules from '../../config/validation';

const statusList = ['processing', 'canceled', 'performed', 'shipping'];
const errorMsg = ` can be specified from this list: ${statusList.join(', ')}`;

const OrderSchema = new Schema(
    {
        orderNo: {
            type: String,
            required: true,
            default: `${Date.now().toString()}-${getRandomInt(1, 10)}`,
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
                    required: [true, 'Product id must be specified'],
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
                    required: [true, 'Order quantity must be specified'],
                    min: 0,
                },
            },
        ],

        orderAsGuest: {
            type: Boolean,
            default: false,
        },
        userName: {
            type: String,
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
            type: String
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
            enum: {
                values: statusList,
                message: errorMsg,
            },
            default: statusList[0],
        },
        email: {
            type: String,
            required: true,
        },
        orderComment: {
            type: String,
        },
        deliveryComfortTimeInterval: {
            type: String,
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            validate: {
                validator: function (phoneNumber) {
                    return validationRules.phoneReExp.test(phoneNumber);
                },
                message: props => `${props.value} is not valid phone number`,
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

OrderSchema.plugin(validator);
OrderSchema.plugin(autoPopulate);

export default mongoose.model('orders', OrderSchema);
