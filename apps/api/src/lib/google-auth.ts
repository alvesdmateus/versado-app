import { AppError } from "../middleware/error-handler";

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export async function verifyGoogleAccessToken(
  accessToken: string
): Promise<GoogleUserInfo> {
  const res = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new AppError(401, "Invalid Google access token", "GOOGLE_AUTH_FAILED");
  }

  const data = (await res.json()) as GoogleUserInfo;

  if (!data.email || !data.email_verified) {
    throw new AppError(
      401,
      "Google account email is not verified",
      "GOOGLE_EMAIL_NOT_VERIFIED"
    );
  }

  return data;
}
