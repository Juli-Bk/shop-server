import { model, Schema } from 'mongoose';
import schemaOptions from '../schemaOptions';

const list = ['clothing', 'shoes', 'hats', 'belts', 'scarves', 'one size'];
const errMessage = ` can be specified from the list: ${list.join(', ')}`;

const SizeSchema = new Schema({
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, ' is required'],
  },
  sizeType: {
    type: String,
    lowercase: true,
    trim: true,
    enum: {
      values: list,
      message: errMessage,
    },
    required: [true, errMessage],
  },
  createdDate: {
    type: Date,
  },
  updatedDate: {
    type: Date,
  },
},
schemaOptions);

// because of this should be plain function,
// arrow functions gives undefined for this
// eslint-disable-next-line func-names
SizeSchema.virtual('sizeTypeSizeName').get(function () {
  return `${this.sizeType}/${this.name}`.toLowerCase();
});

SizeSchema.index({ '$**': 'text' });
export default model('sizes', SizeSchema);
