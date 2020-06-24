import {model, Schema} from 'mongoose';
import schemaOptions from '../modelHelper';

const RefreshTokenSchema = new Schema({
        token: {
            type: String,
            required: [true, 'token required']
        },
        exp: {
            type: Number,
            required: [true, 'exp required']
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: [true, 'userId required']
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
RefreshTokenSchema.index({'$**': 'text'});
export default model('tokens', RefreshTokenSchema);