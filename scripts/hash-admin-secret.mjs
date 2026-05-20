import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const value = process.argv[2];

if (!value || !/^\d{6,10}$/.test(value)) {
  console.error("Usage: node scripts/hash-admin-secret.mjs <6-10-digit-code>");
  process.exit(1);
}

const salt = randomBytes(16);
const keyLength = 64;
const cost = 16384;
const blockSize = 8;
const parallelization = 1;
const key = await scrypt(value, salt, keyLength, {
  N: cost,
  r: blockSize,
  p: parallelization,
});

console.log(
  [
    "scrypt",
    String(cost),
    String(blockSize),
    String(parallelization),
    String(keyLength),
    salt.toString("hex"),
    Buffer.from(key).toString("hex"),
  ].join("$")
);
