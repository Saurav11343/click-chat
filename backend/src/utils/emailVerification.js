import crypto from "crypto";

export const createEmailVerificationToken = () => {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    verificationToken,
    hashedToken,
    expiresAt,
  };
};

export const hashEmailVerificationToken = (verificationToken) => {
  return crypto.createHash("sha256").update(verificationToken).digest("hex");
};
