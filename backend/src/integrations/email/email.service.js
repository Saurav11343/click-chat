import gmail from "../../config/gmail.js";
import ENV from "../../config/env.js";

export const sendActionEmail = async ({
  email,
  subject,
  heading,
  messageText,
  actionLabel,
  actionUrl,
  expiryText,
  ignoreText,
}) => {
  const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>${heading}</h2>
        <p>${messageText}</p>

        <a
          href="${actionUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            border-radius: 8px;
            background-color: #111827;
            color: #ffffff;
            text-decoration: none;
            font-weight: 600;
          "
        >
          ${actionLabel}
        </a>

        <p style="margin-top: 24px;">${expiryText}</p>
        <p>${ignoreText}</p>
      </div>
    `;

  const message = [
    `From: ClickChat <${ENV.GMAIL_USER}>`,
    `To: ${email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");

  const rawMessage = Buffer.from(message).toString("base64url");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawMessage,
    },
  });

  return response.data;
};

export const sendVerificationEmail = async ({ email, verificationToken }) => {
  const actionUrl = new URL("/verify-email", ENV.CLIENT_URL);
  actionUrl.searchParams.set("token", verificationToken);

  return sendActionEmail({
    email,
    subject: "Verify your ClickChat email",
    heading: "Verify your email address",
    messageText:
      "Thank you for creating a ClickChat account. Confirm your email address to activate it.",
    actionLabel: "Verify email",
    actionUrl: actionUrl.toString(),
    expiryText: "This verification link will expire in 24 hours.",
    ignoreText: "If you did not create this account, you can ignore this email.",
  });
};

export const sendPasswordResetEmail = async ({ email, resetToken }) => {
  const actionUrl = new URL("/reset-password", ENV.CLIENT_URL);
  actionUrl.searchParams.set("token", resetToken);

  return sendActionEmail({
    email,
    subject: "Reset your ClickChat password",
    heading: "Reset your password",
    messageText:
      "We received a request to reset your ClickChat password. Use the button below to choose a new one.",
    actionLabel: "Reset password",
    actionUrl: actionUrl.toString(),
    expiryText: "This password reset link will expire in 30 minutes.",
    ignoreText:
      "If you did not request a password reset, you can safely ignore this email.",
  });
};
