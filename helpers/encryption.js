import crypto from "crypto";
import dotenv from "dotenv";
import path from "node:path";

// Load .env file
dotenv.config({ path: path.join(process.cwd(), ".env") });

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : crypto.randomBytes(32);
const IV_LENGTH = 16;

if (!process.env.ENCRYPTION_KEY) {
  console.warn(
    "⚠️  WARNING: ENCRYPTION_KEY not found in .env! Using random key - data will not be portable!"
  );
}

/**
 * Encrypts text using AES-256-CBC encryption
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
const encrypt = (text) => {
  if (!text) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
};

/**
 * Decrypts text encrypted with encrypt() function
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} - Decrypted plain text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;

  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encrypted = parts.join(":");

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

export { encrypt, decrypt };
