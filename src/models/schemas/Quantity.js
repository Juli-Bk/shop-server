import { model, Schema } from 'mongoose';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import schemaOptions from '../schemaOptions';

const QuantitySchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'products',
    required: [true, 'must be specified'],
  },
  colorId: {
    type: Schema.Types.ObjectId,
    ref: 'colors',
    autopopulate: true,
  },
  quantity: {
    type: Number,
    required: [true, 'must be specified'],
    min: 0,
  },
  sizeId: {
    type: Schema.Types.ObjectId,
    ref: 'sizes',
    required: [true, 'must be specified'],
    autopopulate: true,
  },

  createdDate: {
    type: Date,
  },
  updatedDate: {
    type: Date,
  },
},
schemaOptions);

QuantitySchema.index({ '$**': 'text' });
QuantitySchema.index({ quantity: 1 });

QuantitySchema.plugin(validator);
QuantitySchema.plugin(autoPopulate);

export default model('quantities', QuantitySchema);
