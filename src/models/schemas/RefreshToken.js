import { model, Schema } from 'mongoose';
import autoPopulate from 'mongoose-autopopulate';
import schemaOptions from '../schemaOptions';

const RefreshTokenSchema = new Schema({
  token: {
    type: String,
    required: [true, 'token required'],
  },
  exp: {
    type: Number,
    required: [true, 'exp required'],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'userId required'],
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
RefreshTokenSchema.plugin(autoPopulate);
RefreshTokenSchema.index({ '$**': 'text' });
export default model('tokens', RefreshTokenSchema);
