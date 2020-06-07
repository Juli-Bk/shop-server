import {model, Schema} from 'mongoose';
import schemaOptions from '../modelHelper';
import bcryptjs from 'bcryptjs';
import validationRules from '../../config/validation';
import validator from 'validator';
import moment from "moment";

const UserSchema = new Schema({
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        phoneNumber: {
            type: String,
            validate: {
                validator: function (phoneNumber) {
                    return validationRules.phoneReExp.test(phoneNumber);
                },
                message: props => `${props.value} is not a valid phone number!`
            }
        },
        birthDate: {
            type: Date,
            validate: {
                validator: function (birthDate) {
                    const bd = moment(birthDate);
                    return bd.isValid()
                        && (bd.format("MM-DD-YYYY") < moment.utc().format("MM-DD-YYYY"));
                },
                message: props => `${props.value} is not a valid!`
            }
        },
        gender: {
            type: String,
            enum: ['male', 'female'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            validate: {
                validator: function (email) {
                    return validator.isEmail(email);
                },
                message: props => `${props.value} is not a valid email!`
            }
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        login: {
            type: String,
            required: [true, 'Login is required'],
            maxlength: 30
        },
        avatarUrl: {
            type: String
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        lastLoginDate: {
            type: Date
        },
        enabled: {
            type: Boolean,
            default: true
        },
        createdDate: {
            type: Date
        },
        updatedDate: {
            type: Date
        },
    },
    schemaOptions
);

UserSchema.index({'$**': 'text'});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcryptjs.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

export default model('users', UserSchema);