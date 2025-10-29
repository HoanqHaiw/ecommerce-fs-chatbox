import express from "express";
import { getRevenueStats } from "../controllers/revenueController.js";

const router = express.Router();

router.get("/", getRevenueStats);

export default router;
