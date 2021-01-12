import { model, Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';
import validator from 'validator';
import moment from 'moment';
import validationRules from '../../config/validation';
import schemaOptions from '../schemaOptions';

const UserSchema = new Schema({
  firstName: {
    type: String,
    lowercase: true,
    trim: true,
  },
  lastName: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator(phoneNumber) {
        return validationRules.phoneReExp.test(phoneNumber);
      },

      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  birthDate: {
    type: Date,
    validate: {
      validator(birthDate) {
        const bd = moment(birthDate);
        return bd.isValid()
                        && (bd.format('MM-DD-YYYY') < moment.utc().format('MM-DD-YYYY'));
      },

      message: (props) => `${props.value} is not a valid!`,
    },
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'Email is required'],
    validate: {
      validator(email) {
        return validator.isEmail(email);
      },

      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  confirmedEmail: {
    type: Boolean,
    default: false,
  },
  addresses: [
    {
      address: {
        type: String,
      },
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      street: {
        type: String,
      },
      house: {
        type: String,
      },
      apartment: {
        type: String,
      },
      postalCode: {
        type: String,
      },
    },
  ],
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  login: {
    type: String,
    maxlength: 30,
  },
  avatarUrl: {
    type: String,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  lastLoginDate: {
    type: Date,
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

UserSchema.index({ '$**': 'text' });

// must be function declaration because of this inside
// eslint-disable-next-line func-names
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  // eslint-disable-next-line consistent-return
  bcryptjs.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

export default model('users', UserSchema);
