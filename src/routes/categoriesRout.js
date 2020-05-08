import express from "express";
import upload from "../config/upload";

import {
    addCategory,
    deleteAllCategories,
    deleteCategoryById,
    getAllCategories,
    getCategoryById,
    updateCategoryById
} from "../controllers/categoryController";

const router = express.Router();

//create
router.put("/", upload.single("category-image"), addCategory);

//read
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

//update
router.post("/:id", upload.single("category-image"), updateCategoryById);

//delete
router.delete("/:id", deleteCategoryById);
router.delete("/", deleteAllCategories);


export default router;