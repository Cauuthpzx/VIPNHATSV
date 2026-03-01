import crypto from "node:crypto";
import { env } from "../config/env.js";

const AES_ALGORITHM = "aes-256-gcm" as const;

function getEncryptionKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Format: iv:authTag:encrypted (all hex)
 */
export function decryptAES(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Ciphertext format invalid (expected iv:authTag:encrypted)");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex!, "hex");
  const authTag = Buffer.from(authTagHex!, "hex");

  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex!, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Decrypt session cookie from DB.
 * If prefixed with "enc:" → AES decrypt, otherwise return as-is (backward compatible).
 */
export function decryptSessionCookie(stored: string): string {
  if (stored.startsWith("enc:")) {
    return decryptAES(stored.slice(4));
  }
  return stored;
}
