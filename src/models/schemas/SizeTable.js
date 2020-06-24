import {model, Schema} from 'mongoose';
import schemaOptions from '../modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';

//table with measurements of exact model
const SizeTableSchema = new Schema({
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'products',
            required: [true, 'To save quantity productId must be specified'],
            autopopulate: true,
        },
        sizeId: {
            type: Schema.Types.ObjectId,
            ref: 'sizes',
            required: [true, 'To save quantity sizeId must be specified'],
            autopopulate: true,
        },

        bust: {
            inches: {
                type: Number,
                min: 0,
            },
            cm: {
                type: Number,
                min: 0,
            },
        },
        waist: {
            inches: {
                type: Number,
                min: 0,
            },
            cm: {
                type: Number,
                min: 0,
            },
        },
        hips: {
            inches: {
                type: Number,
                min: 0,
            },
            cm: {
                type: Number,
                min: 0,
            },
        },
        footLength: {
            inches: {
                type: Number,
                min: 0,
            },
            cm: {
                type: Number,
                min: 0,
            },
        },
        length: {
            inches: {
                type: Number,
                min: 0,
            },
            cm: {
                type: Number,
                min: 0,
            },
        },
        headSize: {
            inches: {
                type: Number,
                min: 0,
            },
            cm: {
                type: Number,
                min: 0,
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

SizeTableSchema.plugin(validator);
SizeTableSchema.plugin(autoPopulate);

export default model('sizeTables', SizeTableSchema);