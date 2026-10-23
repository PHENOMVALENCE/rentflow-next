import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function hashCredential(value: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyCredential(value: string, encoded: string) {
  const [algorithm, salt, hash] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(value, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashPassword(password: string) {
  return hashCredential(password);
}

export function verifyPassword(password: string, encoded: string) {
  return verifyCredential(password, encoded);
}

export function hashPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("Account PIN must contain exactly four digits.");
  return hashCredential(pin);
}

export function verifyPin(pin: string, encoded: string) {
  if (!/^\d{4}$/.test(pin)) return false;
  return verifyCredential(pin, encoded);
}
