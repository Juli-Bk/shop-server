import {model, Schema} from 'mongoose';
import schemaOptions from '../schemaOptions';
import validator from "validator";

const SubscriberSchema = new Schema({
        email: {
            type: String,
            required: [true, 'Email is required to subscribe to newsletter'],
            validate: {
                validator: function (email) {
                    return validator.isEmail(email);
                },
                message: props => `${props.value} is not a valid email!`
            },
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
        }
    },
    schemaOptions
);
SubscriberSchema.index({'$**': 'text'});
export default model('subscribers', SubscriberSchema);