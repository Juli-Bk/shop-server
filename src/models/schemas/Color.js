import {model, Schema} from 'mongoose';
import schemaOptions from '../modelHelper';
import validator from 'mongoose-id-validator';
import autoPopulate from 'mongoose-autopopulate';

const baseColors = [
    {name: 'black', hex: '#000000'}, {name: 'blue', hex: '#0000ff'},
    {name: 'orange', hex: '#ffa500'}, {name: 'peach', hex: '#ffdab9'},
    {name: 'cream', hex: '#f8f8de'}, {name: 'pink', hex: '#fc94a7'},
    {name: 'gold', hex: '#e3cf49'}, {name: 'purple', hex: '#e004e0'},
    {name: 'green', hex: '#08d408'}, {name: 'red', hex: '#ff0000'},
    {name: 'grey', hex: '#808080'}, {name: 'silver', hex: '#e3e2e2'},
    {name: 'yellow', hex: '#ffff00'}, {name: 'white', hex: '#FFFFFF'},
    {name: 'mocha', hex: '#d0c7b6'}, {name: 'mint', hex: '#c1f1d9'},
    {name: 'beige', hex: '#d7b68f'}, {name: 'brown', hex: '#653606'},
    {name: 'multi', hex: '#ffffff'}, {name: 'animal', hex: '#ffffff'},
];
const colorsNameList = baseColors.map(color => color.name.toLowerCase());
const errorMsg = ` can be specified from this list: ${colorsNameList.join(', ')}`;

const ColorSchema = new Schema({
        name: {
            type: String,
            required: [true, 'Color name must be specified'],
            min: 1,
        },
        baseColorName: {
            type: String,
            enum: {
                values: colorsNameList,
                message: errorMsg,
            },
            required: [true, errorMsg],
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

ColorSchema.virtual('hexBaseColor').get(function () {
    return baseColors
        .filter(color => color.name.toLowerCase() === this.baseColorName)
        .map(c => c.hex)[0];
});

ColorSchema.index({'$**': 'text'});

ColorSchema.plugin(validator);
ColorSchema.plugin(autoPopulate);

export default model('colors', ColorSchema);