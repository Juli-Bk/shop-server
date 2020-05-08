import express from "express";

import {
    addSize,
    deleteAllSizes,
    deleteSizeById,
    getAllSizes,
    getSizeById,
    updateSizeById
} from "../controllers/sizeController";

const router = express.Router();

//create
router.put("/", addSize);

//read
router.get("/", getAllSizes);
router.get("/:id", getSizeById);

//update
router.post("/:id", updateSizeById);

//delete
router.delete("/:id", deleteSizeById);
router.delete("/", deleteAllSizes);


export default router;