import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { success } from "zod";
import { generateToken } from "../utils/generateToken.js";

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      dateOfBirth,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "user registered successfully",
    });
  } catch (error) {
    console.log("Register Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    generateToken(user._id, res);

    return res.status(200).json({
      success: true,
      message: "Login Successful",
    });
  } catch (error) {
    console.log("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: `welcome ${req.user.firstName} ${req.user.lastName}`,
      user: req.user,
    });
  } catch (error) {
    console.log("Error in checkAuth controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
