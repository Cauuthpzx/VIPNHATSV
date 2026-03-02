import crypto from "node:crypto";
import { env } from "../config/env.js";

const AES_ALGORITHM = "aes-256-gcm" as const;

function getEncryptionKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, "hex");
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Format: iv:authTag:encrypted (all hex)
 *
 * Supports key rotation: if primary key fails and ENCRYPTION_KEY_OLD is set,
 * retries with the old key.
 */
export function decryptAES(ciphertext: string): string {
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Ciphertext format invalid (expected iv:authTag:encrypted)");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex!, "hex");
  const authTag = Buffer.from(authTagHex!, "hex");

  // Try primary key first
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex!, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (primaryErr) {
    // Fallback to old key if available
    const oldKeyHex = process.env.ENCRYPTION_KEY_OLD;
    if (oldKeyHex && oldKeyHex.length === 64) {
      const oldKey = Buffer.from(oldKeyHex, "hex");
      const decipher = crypto.createDecipheriv(AES_ALGORITHM, oldKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex!, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }
    throw primaryErr;
  }
}

/**
 * Encrypt plaintext with AES-256-GCM using the current primary key.
 * Returns format: iv:authTag:encrypted (all hex)
 */
export function encryptAES(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
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
