import {model, Schema} from 'mongoose';
import schemaOptions from './modelHelper';
import moment from "moment";

const SizeSchema = new Schema({
        name: {
            type: String,
            required: [true, 'Size name is required']
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
SizeSchema.index({'$**': 'text'});
export default model('sizes', SizeSchema);