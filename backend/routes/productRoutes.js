import express from "express";
import multer from "multer";
import { createProduct, getAllProducts, getProductById } from "../controllers/productController.js";

const router = express.Router();

// Cấu hình multer lưu file vào thư mục /uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // nơi lưu file
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Thêm sản phẩm mới (tối đa 3 ảnh)
router.post("/", upload.array("images", 3), createProduct);

// Lấy danh sách sản phẩm
router.get("/", getAllProducts);

// Lấy chi tiết 1 sản phẩm
router.get("/:id", getProductById);

export default router;
