import {model, Schema} from "mongoose";
import schemaOptions from "./modelHelper";

const SizeSchema = new Schema({
        name: {
            type: String,
            required: [true, "Size name is required"]
        }
    },
    schemaOptions
);
SizeSchema.index({'$**': 'text'});
export default model("sizes", SizeSchema);