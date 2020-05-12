import {model, Schema} from 'mongoose';
import schemaOptions from './modelHelper';

const BrandSchema = new Schema({
        name: {
            type: String,
            required: [true, 'Brand name is required']
        },
        imageUrl: {
            type: String
        }
    },
    schemaOptions
);
BrandSchema.index({'$**': 'text'});
export default model('brands', BrandSchema);