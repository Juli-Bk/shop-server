import express from "express";
import upload from "../config/upload";

import {
    addBrand,
    deleteAllBrands,
    deleteBrandById,
    getAllBrands,
    getBrandById,
    updateBrandById
} from "../controllers/brandController";

const router = express.Router();

//create
router.put("/", upload.single("brand-image"), addBrand);

//read
router.get("/", getAllBrands);
router.get("/:id", getBrandById);

//update
router.post("/:id", upload.single("brand-image"), updateBrandById);

//delete
router.delete("/:id", deleteBrandById);
router.delete("/", deleteAllBrands);


export default router;