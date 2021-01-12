import { model, Schema } from 'mongoose';
import validator from 'validator';
import schemaOptions from '../schemaOptions';

const SubscriberSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'Email is required to subscribe to newsletter'],
    validate: {
      validator(email) {
        return validator.isEmail(email);
      },

      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  createdDate: {
    type: Date,
  },
  updatedDate: {
    type: Date,
  },
},
schemaOptions);
SubscriberSchema.index({ '$**': 'text' });
export default model('subscribers', SubscriberSchema);
