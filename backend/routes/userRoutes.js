import express from "express";
import {
    updateVIPStatus,
    getUsers,
    getUserByPhone,
    deleteUser
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:phone", getUserByPhone);
router.put("/update-vip", updateVIPStatus);
router.delete("/:id", deleteUser);

export default router;