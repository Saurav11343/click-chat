import mailer from "../config/mailer.js";
import ENV from "../config/env.js";

export const sendVerificationEmail = async ({ email, verificationToken }) => {
  const verificationUrl = new URL("/verify-email", ENV.CLIENT_URL);

  verificationUrl.searchParams.set("token", verificationToken);

  const info = await mailer.sendMail({
    from: `ClickChat <${ENV.GMAIL_USER}>`,
    to: email,
    subject: "Verify your ClickChat email",
    text: `Verify your ClickChat email by opening this link: ${verificationUrl.toString()}\n\nThis link expires in 24 hours.`,
    html: `
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
    `,
  });

  return info;
};
