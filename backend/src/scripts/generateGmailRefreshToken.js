import http from "http";

import { google } from "googleapis";

import ENV from "../config/env.js";

const requiredEnvironmentVariables = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (variableName) => !ENV[variableName],
);

if (missingEnvironmentVariables.length > 0) {
  console.error(
    `Missing environment variables: ${missingEnvironmentVariables.join(", ")}`,
  );

  process.exit(1);
}

const redirectUrl = new URL(ENV.GOOGLE_REDIRECT_URI);

if (!["localhost", "127.0.0.1"].includes(redirectUrl.hostname)) {
  console.error("GOOGLE_REDIRECT_URI must use localhost for this script.");
  process.exit(1);
}

const oauthClient = new google.auth.OAuth2(
  ENV.GOOGLE_CLIENT_ID,
  ENV.GOOGLE_CLIENT_SECRET,
  ENV.GOOGLE_REDIRECT_URI,
);

const authorizationUrl = oauthClient.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

const port = Number(redirectUrl.port || 80);

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, ENV.GOOGLE_REDIRECT_URI);

  if (requestUrl.pathname !== redirectUrl.pathname) {
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("Not found");
    return;
  }

  const oauthError = requestUrl.searchParams.get("error");
  const authorizationCode = requestUrl.searchParams.get("code");

  if (oauthError || !authorizationCode) {
    res.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("Gmail authorization failed. You may close this window.");

    console.error(
      `Gmail authorization failed: ${oauthError || "Missing authorization code"}`,
    );

    server.close();
    return;
  }

  try {
    const { tokens } = await oauthClient.getToken(authorizationCode);

    if (!tokens.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. Revoke the app permission and try again.",
      );
    }

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("Gmail authorization succeeded. You may close this window.");

    console.log("\nAdd this secret to backend/.env and Railway:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (error) {
    res.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("Unable to create the Gmail refresh token.");

    console.error("Unable to create Gmail refresh token:", error.message);
  } finally {
    server.close();
  }
});

server.listen(port, () => {
  console.log("Open this URL in your browser:\n");
  console.log(`${authorizationUrl}\n`);
  console.log("Waiting for Google authorization...");
});
