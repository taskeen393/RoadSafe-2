import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token" });

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not defined in .env!");
      return res.status(500).json({ msg: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.error("❌ Auth Error: User not found for ID", decoded.id);
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.name, "-", error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: "Token expired" });
    }
    return res.status(401).json({ msg: "Token invalid" });
  }
};
