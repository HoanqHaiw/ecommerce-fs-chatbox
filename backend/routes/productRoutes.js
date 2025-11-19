import express from "express";
import multer from "multer";
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCollection,
} from "../controllers/productController.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = multer({ storage });


router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/collection/:collectionName", getProductsByCollection);
router.post("/", upload.array("images", 3), createProduct);
router.put("/:id", upload.array("images", 3), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
