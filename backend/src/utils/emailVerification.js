import { createActionToken, hashActionToken } from "./actionToken.js";

export const createEmailVerificationToken = () => {
  const { token, hashedToken, expiresAt } = createActionToken({
    expiresInMinutes: 24 * 60,
  });

  return {
    verificationToken: token,
    hashedToken,
    expiresAt,
  };
};

export const hashEmailVerificationToken = (verificationToken) => {
  return hashActionToken(verificationToken);
};
