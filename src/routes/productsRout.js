import express from "express";
import upload from "../config/upload";

import {
    addProduct,
    deleteAllProducts,
    deleteProductById,
    getAllProducts,
    getProductById,
    getProductsByFilterParams,
    searchProducts,
    updateProductById
} from "../controllers/productController";

const router = express.Router();

//create
router.put("/", upload.array("product-images"), addProduct);

//read
router.get("/", getAllProducts);
router.get("/filter", getProductsByFilterParams);
router.post("/search", searchProducts);
router.get("/:id", getProductById);

//update
router.post("/:id", upload.array("product-images"), updateProductById);

//delete
router.delete("/:id", deleteProductById);
router.delete("/", deleteAllProducts);


export default router;