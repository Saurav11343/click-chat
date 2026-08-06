import jwt from "jsonwebtoken";
import User from "../modules/users/user.model.js";
import ENV from "../config/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid User",
      });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token",
      });
    }

    const user = await User.findById(decoded.userId).select(
      "-password +passwordChangedAt",
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.passwordChangedAt &&
      decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000
    ) {
      return res.status(401).json({
        success: false,
        message: "Your password changed. Please log in again.",
      });
    }

    user.passwordChangedAt = undefined;

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res.status(401).json({
      message: "unauthorized - Invalid token",
    });
  }
};
