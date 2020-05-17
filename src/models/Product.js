import mongoose, {Schema} from 'mongoose';
import schemaOptions from './modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';

const ProductSchema = new mongoose.Schema({
        enabled: {
            type: Boolean,
            default: true
        },
        featured: {
            type: Boolean
        },
        special: {
            type: Boolean
        },
        bestseller: {
            type: Boolean
        },
        description: {
            type: String,
            required: [true, 'Description is required']
        },
        name: {
            type: String,
            required: [true, 'Product name is required']
        },
        price: {
            required: [true, 'Price is required'],
            type: Number
        },
        salePrice: {
            type: Number
        },
        imageUrls: [{
            required: [true, 'imageUrl is required'],
            type: String
        }],
        videoUrl: {
            type: String
        },
        createdDate: {
            type: Date
        },
        updatedDate: {
            type: Date
        },
        manufacturedCountry: {
            type: String
        },
        quantityTableId: [{
            type: mongoose.ObjectId,
            ref: 'quantities',
            default: null
        }],
        sizeTableId: {
            type: mongoose.ObjectId,
            ref: 'sizeTables',
            default: null,
            autopopulate: true
        },
        brandId: {
            type: mongoose.ObjectId,
            ref: 'brands',
            default: null,
            autopopulate: true
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'categories',
            required: [true, 'Category for a product must be specified'],
            autopopulate: true
        }
    },
    schemaOptions
);

ProductSchema.plugin(validator);
ProductSchema.plugin(autoPopulate);

ProductSchema.index({'$**': 'text'});

export default mongoose.model('products', ProductSchema);