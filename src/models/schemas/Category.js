import { model, Schema } from 'mongoose';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import schemaOptions from '../schemaOptions';

const CategorySchema = new Schema({
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'field is required'],
  },
  categoryBreadcrumbs: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'field is required'],
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'categories',
    default: null,
    autopopulate: true,
  },
  level: {
    type: Number,
  },
  imageAlt: {
    type: String,
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
CategorySchema.index({ '$**': 'text' });
CategorySchema.plugin(validator);
CategorySchema.plugin(autoPopulate);

export default model('categories', CategorySchema);
