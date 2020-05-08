import express from "express";

import {
    addSizeTable,
    deleteAllSizeTables,
    deleteSizeTableById,
    getAllSizeTables,
    getSizeTableById,
    updateSizeTableById
} from "../controllers/sizeTableController";

const router = express.Router();

//create
router.put("/", addSizeTable);

//read
router.get("/", getAllSizeTables);
router.get("/:id", getSizeTableById);

//update
router.post("/:id", updateSizeTableById);

//delete
router.delete("/:id", deleteSizeTableById);
router.delete("/", deleteAllSizeTables);


export default router;