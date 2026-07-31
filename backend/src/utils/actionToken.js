import crypto from "node:crypto";

export const createActionToken = ({ expiresInMinutes }) => {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    hashedToken: hashActionToken(token),
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
  };
};

export const hashActionToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
