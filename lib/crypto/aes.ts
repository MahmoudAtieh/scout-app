// AES-GCM 256 مع مفتاح مشتق من كلمة سر عبر PBKDF2
// المفتاح يُخزَّن في sessionStorage بعد أول إدخال، فلا يُحفظ على القرص.
// الصيغة المخزّنة: [salt(16)][iv(12)][ciphertext]

const SALT_BYTES = 16;
const IV_BYTES = 12;
const ITERATIONS = 210_000; // OWASP 2023
const KEY_STORAGE = "scout_crypto_key_b64";

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    // @ts-expect-error type mismatch with BufferSource in new TS
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// مفتاح ثابت للوحدة (يدخله القائد مرة). نشتقه من كلمة سر مع salt عشوائي لكل حقل.
let unlockedPassword: string | null = null;

export function isUnlocked(): boolean {
  if (unlockedPassword !== null) return true;
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY_STORAGE) !== null;
}

export function unlock(password: string) {
  unlockedPassword = password;
  if (typeof window !== "undefined") sessionStorage.setItem(KEY_STORAGE, btoa(password));
}

export function lock() {
  unlockedPassword = null;
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY_STORAGE);
}

function getPassword(): string {
  if (unlockedPassword) return unlockedPassword;
  if (typeof window === "undefined") throw new Error("crypto: no password");
  const b64 = sessionStorage.getItem(KEY_STORAGE);
  if (!b64) throw new Error("crypto locked");
  unlockedPassword = atob(b64);
  return unlockedPassword;
}

export async function encryptString(plain: string | null | undefined): Promise<Uint8Array | null> {
  if (plain === null || plain === undefined || plain === "") return null;
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveKey(getPassword(), salt);
  const enc = new TextEncoder();
  const ct = new Uint8Array(
    // @ts-expect-error type mismatch with BufferSource in new TS
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain))
  );
  const out = new Uint8Array(SALT_BYTES + IV_BYTES + ct.length);
  out.set(salt, 0);
  out.set(iv, SALT_BYTES);
  out.set(ct, SALT_BYTES + IV_BYTES);
  return out;
}

export async function decryptString(blob: Uint8Array | null | undefined): Promise<string | null> {
  if (!blob || blob.length === 0) return null;
  try {
    const salt = blob.slice(0, SALT_BYTES);
    const iv = blob.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ct = blob.slice(SALT_BYTES + IV_BYTES);
    const key = await deriveKey(getPassword(), salt);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

// مساعد: bytea من Supabase يصلنا كـ \x<hex>؛ نحوّله لـ Uint8Array
export function hexToBytes(hex: string | null | undefined): Uint8Array | null {
  if (!hex) return null;
  const h = hex.startsWith("\\x") ? hex.slice(2) : hex;
  if (h.length === 0) return null;
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

export function bytesToHex(arr: Uint8Array | null | undefined): string | null {
  if (!arr) return null;
  return "\\x" + Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}
