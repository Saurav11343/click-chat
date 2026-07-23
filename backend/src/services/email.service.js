import gmail from "../config/gmail.js";
import ENV from "../config/env.js";

export const sendVerificationEmail = async ({ email, verificationToken }) => {
  const verificationUrl = new URL("/verify-email", ENV.CLIENT_URL);

  verificationUrl.searchParams.set("token", verificationToken);

  const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Verify your email address</h2>

        <p>
          Thank you for creating a ClickChat account.
        </p>

        <p>
          Click the button below to verify your email address:
        </p>

        <a
          href="${verificationUrl.toString()}"
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
          Verify email
        </a>

        <p style="margin-top: 24px;">
          This verification link will expire in 24 hours.
        </p>

        <p>
          If you did not create this account, you can ignore this email.
        </p>
      </div>
    `;

  const message = [
    `From: ClickChat <${ENV.GMAIL_USER}>`,
    `To: ${email}`,
    "Subject: Verify your ClickChat email",
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
