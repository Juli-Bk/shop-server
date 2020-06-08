import {model, Schema} from 'mongoose';
import schemaOptions from '../modelHelper';

const list = ['clothing', 'shoes', 'hats', 'belts', 'scarves', 'one size'];
const errMessage = ` can be specified from this list: ${list.join(', ')}`;

const SizeSchema = new Schema({
        name: {
            type: String,
            required: [true, 'Size name is required'],
        },
        sizeType: {
            type: String,
            enum: {
                values: list,
                message: errMessage,
            },
            required: [true, errMessage],
        },
        createdDate: {
            type: Date,
        },
        updatedDate: {
            type: Date,
        },
    },
    schemaOptions,
);

SizeSchema.virtual('sizeTypeSizeName').get(function () {
    return `${this.sizeType}/${this.name}`.toLowerCase();
});
SizeSchema.index({'$**': 'text'});
export default model('sizes', SizeSchema);