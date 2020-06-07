import {model, Schema} from 'mongoose';
import schemaOptions from '../modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';

const CategorySchema = new Schema({
        name: {
            type: String,
            required: [true, 'Category name is required']
        },
        categoryBreadcrumbs: {
            type: String,
            required: [true, 'CategoryBreadcrumbs is required']
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'categories',
            default: null,
            autopopulate: true
        },
        level: {
            type: Number
        },
        imageAlt: {
            type: String
        },
        imageUrl: {
            type: String
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
CategorySchema.index({'$**': 'text'});
CategorySchema.plugin(validator);
CategorySchema.plugin(autoPopulate);

export default model('categories', CategorySchema);