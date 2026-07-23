import { google } from "googleapis";

import ENV from "./env.js";

const gmailOAuthClient = new google.auth.OAuth2(
  ENV.GOOGLE_CLIENT_ID,
  ENV.GOOGLE_CLIENT_SECRET,
  ENV.GOOGLE_REDIRECT_URI,
);

if (ENV.GOOGLE_REFRESH_TOKEN) {
  gmailOAuthClient.setCredentials({
    refresh_token: ENV.GOOGLE_REFRESH_TOKEN,
  });
}

const gmail = google.gmail({
  version: "v1",
  auth: gmailOAuthClient,
});

export { gmailOAuthClient };

export default gmail;
