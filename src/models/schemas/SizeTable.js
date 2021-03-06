import { model, Schema } from 'mongoose';
import autoPopulate from 'mongoose-autopopulate';
import validator from 'mongoose-id-validator';
import schemaOptions from '../schemaOptions';

// table with measurements of exact model
const SizeTableSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'products',
    required: [true, 'To save sizeTable productId must be specified'],
  },
  sizeId: {
    type: Schema.Types.ObjectId,
    ref: 'sizes',
    required: [true, 'To save sizeTable sizeId must be specified'],
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
      type: String,
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
schemaOptions);

SizeTableSchema.plugin(validator);
SizeTableSchema.plugin(autoPopulate);

export default model('sizeTables', SizeTableSchema);
