import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // nếu có User model

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // lưu thông tin user nếu cần
            next();
        } catch (error) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    } else {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
