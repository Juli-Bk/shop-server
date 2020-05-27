import {model, Schema} from 'mongoose';
import schemaOptions from './modelHelper';

const SubscriberSchema = new Schema({
        email: {
            type: String,
            required: [true, 'Email is required to subscribe to newsletter']
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