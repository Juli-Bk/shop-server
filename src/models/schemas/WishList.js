import mongoose, { Schema } from 'mongoose';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import schemaOptions from '../schemaOptions';

const WishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default: null,
      autopopulate: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null,
        autopopulate: true,
      },
    ],
  },
  schemaOptions,
);

WishlistSchema.plugin(validator);
WishlistSchema.plugin(autoPopulate);

export default mongoose.model('wishs', WishlistSchema);
