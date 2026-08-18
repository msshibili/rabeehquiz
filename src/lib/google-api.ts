import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

interface ServiceAccountCredentials {
  serviceAccountEmail: string;
  privateKey: string;
}

/**
 * Generate Google OAuth2 Access Token using RS256 JWT assertion with Service Account
 */
export async function getGoogleAccessToken(creds: ServiceAccountCredentials): Promise<string> {
  const { serviceAccountEmail, privateKey } = creds;
  if (!serviceAccountEmail || !privateKey) {
    throw new Error("Missing Google Service Account email or private key.");
  }

  // Format private key (replace escaped newlines if passed from env/JSON string)
  const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer
    .sign(formattedPrivateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwtAssertion = `${unsignedToken}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtAssertion,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(`Google Auth Failed: ${tokenData.error_description || tokenData.error || "Invalid credentials"}`);
  }

  return tokenData.access_token;
}

/**
 * Upload screenshot image file to specified Google Drive Folder ID
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  folderId: string,
  relativeFilePath: string,
  customFileName?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const absolutePath = path.isAbsolute(relativeFilePath)
    ? relativeFilePath
    : path.join(process.cwd(), "public", relativeFilePath.replace(/^\//, ""));

  const fileBuffer = await fs.readFile(absolutePath);
  const fileName = customFileName || path.basename(absolutePath);
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = `-------${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = Buffer.concat([
    Buffer.from(
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
    ),
    Buffer.from(`${delimiter}Content-Type: ${mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  const fileData = await uploadRes.json();
  if (!uploadRes.ok || !fileData.id) {
    throw new Error(`Google Drive Upload Failed: ${fileData.error?.message || "Upload error"}`);
  }

  // Make file publicly readable
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });
  } catch (err) {}

  const webViewLink = fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`;
  return { fileId: fileData.id, webViewLink };
}

/**
 * Append or update participant row in Google Sheet
 */
export async function appendToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  rowValues: (string | number | boolean)[]
): Promise<boolean> {
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google Sheets Append Failed: ${data.error?.message || "Sheet update error"}`);
  }

  return true;
}

/**
 * Send payload to a free Google Apps Script Web App URL (Zero-credential setup)
 */
export async function postToGoogleWebApp(webAppUrl: string, payload: any): Promise<any> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl.startsWith("http")) {
    throw new Error("Invalid Google Apps Script URL. Must start with https://script.google.com");
  }

  const res = await fetch(cleanUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    return { success: res.ok, raw: text };
  }
}
