import {model, Schema} from 'mongoose';
import schemaOptions from '../modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';

const QuantitySchema = new Schema({
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'products',
            required: [true, 'To save quantity productId must be specified'],
            autopopulate: true
        },
        colorId: {
            type: Schema.Types.ObjectId,
            ref: 'colors',
            autopopulate: true
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity must be specified'],
            min: 0
        },
        sizeId: {
            type: Schema.Types.ObjectId,
            ref: 'sizes',
            required: [true, 'Size must be specified'],
            autopopulate: true
        },
        createdDate: {
            type: Date
        },
        updatedDate: {
            type: Date
        }
    },
    schemaOptions
);

QuantitySchema.index({'$**': 'text'});

QuantitySchema.plugin(validator);
QuantitySchema.plugin(autoPopulate);

export default model('quantities', QuantitySchema);