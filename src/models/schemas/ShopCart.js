import mongoose, {Schema} from 'mongoose';
import schemaOptions from '../schemaOptions';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import {getRandomItemId} from '../../helpers/helper';
import moment from 'moment';

const ShopCart = new mongoose.Schema({
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        anonymousId: {
            type: String,
            default: getRandomItemId()
        },
        products: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'products',
                    required: [true, 'Product id must be specified']
                },
                sizeId: {
                    type: Schema.Types.ObjectId,
                    ref: 'sizes'
                },
                colorId: {
                    type: Schema.Types.ObjectId,
                    ref: 'colors'
                },
                cartQuantity: {
                    type: Number,
                    default: 0,
                    min: 0
                },
            },
        ],
        createdDate: {
            type: Date,
            default: moment.utc().format('MM-DD-YYYY'),
        },
    },
    schemaOptions
);

ShopCart.plugin(validator);
ShopCart.plugin(autoPopulate);

export default mongoose.model('shopcarts', ShopCart);