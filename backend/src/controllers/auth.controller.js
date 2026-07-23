import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { success } from "zod";
import { generateToken, clearToken } from "../utils/token.js";
import ENV from "../config/env.js";
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
} from "../utils/emailVerification.js";
import { sendVerificationEmail } from "../services/email.service.js";

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const { verificationToken, hashedToken, expiresAt } =
      createEmailVerificationToken();

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      dateOfBirth,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpiresAt: expiresAt,
      emailVerificationSentAt: new Date(),
    });

    let emailSent = true;

    try {
      await sendVerificationEmail({
        email: user.email,
        verificationToken,
      });
    } catch (emailError) {
      emailSent = false;

      user.emailVerificationSentAt = null;

      await user.save();

      console.error("Verification email error:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      emailSent,
      message: emailSent
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful, but the verification email could not be sent. Please request another verification email.",
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        requiresEmailVerification: true,
        message: "Please verify your email before logging in.",
      });
    }

    generateToken(user._id, res);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
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

export const logout = async (req, res) => {
  try {
    clearToken(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server Error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.validatedQuery;

    const hashedToken = hashEmailVerificationToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiresAt: {
        $gt: new Date(),
      },
    }).select(
      "+emailVerificationToken +emailVerificationExpiresAt +emailVerificationSentAt",
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "The verification link is invalid or has expired.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiresAt = null;
    user.emailVerificationSentAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Your email has been verified successfully.",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify email.",
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+emailVerificationSentAt");

    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message:
          "If an unverified account exists for this email, a verification email will be sent.",
      });
    }

    const cooldownMilliseconds = 60 * 1000;

    if (user.emailVerificationSentAt) {
      const timeSinceLastEmail =
        Date.now() - user.emailVerificationSentAt.getTime();

      if (timeSinceLastEmail < cooldownMilliseconds) {
        const retryAfter = Math.ceil(
          (cooldownMilliseconds - timeSinceLastEmail) / 1000,
        );

        return res.status(429).json({
          success: false,
          retryAfter,
          message: `Please wait ${retryAfter} seconds before requesting another email.`,
        });
      }
    }

    const { verificationToken, hashedToken, expiresAt } =
      createEmailVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiresAt = expiresAt;
    user.emailVerificationSentAt = new Date();

    await user.save();

    try {
      await sendVerificationEmail({
        email: user.email,
        verificationToken,
      });
    } catch (emailError) {
      user.emailVerificationSentAt = null;

      await user.save();

      console.error("Resend verification email error:", emailError.message);

      return res.status(503).json({
        success: false,
        message: "The verification email could not be sent. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "A new verification email has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resend verification email.",
    });
  }
};
