import {model, Schema} from 'mongoose';
import schemaOptions from './modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';

//table with measurements of concrete model
const SizeTableSchema = new Schema({
        sizeId: {
            type: Schema.Types.ObjectId,
            ref: 'sizes',
            autopopulate: true
        },
        shoeLength: {
            type: Number,
            min: 0
        },
        length: {
            type: Number,
            min: 0
        },
        bust: {
            type: Number,
            min: 0
        },
        shoulder: {
            type: Number,
            min: 0
        },
        sleeve: {
            type: Number,
            min: 0
        },
        waist: {
            type: Number,
            min: 0
        },
        hip: {
            type: Number,
            min: 0
        },
        rise: {
            type: Number,
            min: 0
        },
        sm: {
            type: Boolean,
            default: true
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

SizeTableSchema.plugin(validator);
SizeTableSchema.plugin(autoPopulate);

export default model('sizeTables', SizeTableSchema);