import mongoose, {Schema} from 'mongoose';
import schemaOptions from '../modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';
import config from '../../config';

const ProductSchema = new mongoose.Schema({
        enabled: {
            type: Boolean,
            default: true,
        },
        featured: {
            type: Boolean,
            default: false,
        },
        special: {
            type: Boolean,
            default: false,
        },
        bestseller: {
            type: Boolean,
            default: false,
        },
        rating: {
            type: Number,
            default: 0,
        },

        productId: {
            type: Number,
            required: [true, 'productId for a product must be specified'],
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        price: {
            required: [true, 'Price is required'],
            type: Number,
        },
        manufacturerCountry: {
            type: String,
        },
        imageUrls: [{
            required: [true, 'imageUrl is required'],
            type: String,
        }],
        videoUrl: {
            type: String,
        },
        materials: {
            type: String,
        },
        salePrice: {
            type: Number,
        },
        isOnSale: {
            type: Boolean,
            default: false,
        },

        createdDate: {
            type: Date,
        },
        updatedDate: {
            type: Date,
        },

        brandId: {
            type: mongoose.ObjectId,
            ref: 'brands',
            default: null,
            autopopulate: true,
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'categories',
            required: [true, 'Category for a product must be specified'],
            autopopulate: true,
        },
    },
    schemaOptions,
);

ProductSchema.plugin(validator);
ProductSchema.plugin(autoPopulate);

ProductSchema.index({'$**': 'text'});
ProductSchema.index({price: 1});
ProductSchema.index({salePrice: 1});
ProductSchema.index({salePrice: -1});

ProductSchema.index({createdDate: 1});
ProductSchema.index({createdDate: -1});

ProductSchema.index({manufacturerCountry: 1});
ProductSchema.index({rating: 1});
// for banners index
ProductSchema.index({bestseller: 1});
ProductSchema.index({isOnSale: 1});
ProductSchema.index({special: 1});
ProductSchema.index({categoryId: 1});

ProductSchema.index({categoryId: 1, createdDate: -1});
ProductSchema.index({categoryId: 1, salePrice: -1});
ProductSchema.index({categoryId: 1, salePrice: 1});
ProductSchema.index({categoryId: 1, salePrice: -1, price: 1});
ProductSchema.index({_id: 1, categoryId: 1, salePrice: -1, price: 1});

ProductSchema.index({isOnSale: 1, createdDate: -1});


ProductSchema.pre('find', function () {
    if (config.environment === 'development') {
        this._startTime = Date.now();
    }
});

ProductSchema.post('find', function () {
    if (config.environment === 'development') {
        if (this._startTime != null) {
            const query = this.getQuery();
            const options = this.getOptions();
            console.log('Product select time: ', (new Date() - this._startTime) / 1000, 's');
            console.log('Product select filters: ', JSON.stringify(query));
            console.log('Product select options: ', JSON.stringify(options));
            console.log('---------------------------------------------');
        }
    }
});

export default mongoose.model('products', ProductSchema);