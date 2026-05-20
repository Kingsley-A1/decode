import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

export async function hashAdminSecret(value: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(value, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  });

  return [
    "scrypt",
    String(SCRYPT_COST),
    String(SCRYPT_BLOCK_SIZE),
    String(SCRYPT_PARALLELIZATION),
    String(SCRYPT_KEY_LENGTH),
    salt.toString("hex"),
    key.toString("hex"),
  ].join("$");
}

export async function verifyAdminSecret({
  value,
  hash,
}: {
  readonly value: string;
  readonly hash: string;
}): Promise<boolean> {
  const parsedHash = parseSecretHash(hash);
  if (!parsedHash) return false;

  const key = await scrypt(value, parsedHash.salt, parsedHash.keyLength, {
    N: parsedHash.cost,
    r: parsedHash.blockSize,
    p: parsedHash.parallelization,
  });

  return timingSafeEqual(key, parsedHash.expectedKey);
}

export function createAdminSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAdminSessionToken(token: string): string {
  return createHmac("sha256", getHashSecret()).update(token).digest("hex");
}

export function hashAdminTelemetryValue(value: string): string {
  return createHash("sha256").update(`${getHashSecret()}:${value}`).digest("hex");
}

interface ParsedSecretHash {
  readonly cost: number;
  readonly blockSize: number;
  readonly parallelization: number;
  readonly keyLength: number;
  readonly salt: Buffer;
  readonly expectedKey: Buffer;
}

function parseSecretHash(hash: string): ParsedSecretHash | null {
  const [algorithm, cost, blockSize, parallelization, keyLength, salt, key] =
    hash.split("$");

  if (algorithm !== "scrypt" || !cost || !blockSize || !parallelization) {
    return null;
  }

  if (!keyLength || !salt || !key) return null;

  return {
    cost: Number.parseInt(cost, 10),
    blockSize: Number.parseInt(blockSize, 10),
    parallelization: Number.parseInt(parallelization, 10),
    keyLength: Number.parseInt(keyLength, 10),
    salt: Buffer.from(salt, "hex"),
    expectedKey: Buffer.from(key, "hex"),
  };
}

function getHashSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "decode-local-admin-development-secret"
  );
}

function scrypt(
  value: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(value, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Buffer.from(derivedKey));
    });
  });
}
