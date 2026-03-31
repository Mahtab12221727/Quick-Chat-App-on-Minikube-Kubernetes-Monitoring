import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (!jwtSecret) {
      return res.json({
        success: false,
        message: "Server misconfiguration: JWT_SECRET is not set",
      });
    }

    const authHeader = req.headers.authorization;
    const token =
      (authHeader?.startsWith("Bearer ") && authHeader.split(" ")[1]) ||
      req.headers.token;

    if (!token) {
      return res.json({ success: false, message: "Unauthorized: token missing" });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);

    res.json({ success: false, message: error.message });
  }
};
