import express from "express";

import {
    addQuantity,
    deleteAllQuantitys,
    deleteQuantityById,
    getAllQuantity,
    getQuantityById,
    updateQuantityById
} from "../controllers/quantityController";

const router = express.Router();

//create
router.put("/", addQuantity);

//read
router.get("/", getAllQuantity);
router.get("/:id", getQuantityById);

//update
router.post("/:id", updateQuantityById);

//delete
router.delete("/:id", deleteQuantityById);
router.delete("/", deleteAllQuantitys);


export default router;