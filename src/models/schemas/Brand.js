import { model, Schema } from 'mongoose';
import schemaOptions from '../schemaOptions';

const BrandSchema = new Schema({
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'is required'],
  },
  imageUrl: {
    type: String,
  },
  createdDate: {
    type: Date,
  },
  updatedDate: {
    type: Date,
  },
},
schemaOptions);
BrandSchema.index({ '$**': 'text' });
export default model('brands', BrandSchema);
