import express from "express";
import { updateVIPStatus, getUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.put("/update-vip", updateVIPStatus);

export default router;
