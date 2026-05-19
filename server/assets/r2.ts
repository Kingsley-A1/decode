import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface R2Config {
  readonly bucketName: string;
  readonly publicBaseUrl?: string;
}

interface PutR2ObjectInput {
  readonly key: string;
  readonly body: Buffer | string;
  readonly contentType: string;
}

interface PutR2ObjectResult {
  readonly bucket: string;
  readonly key: string;
  readonly publicUrl?: string;
}

interface SignedUploadInput {
  readonly key: string;
  readonly contentType: string;
  readonly expiresInSeconds?: number;
}

interface R2ObjectHead {
  readonly contentType?: string;
  readonly contentLength?: number;
}

interface R2ObjectBody extends R2ObjectHead {
  readonly body: Uint8Array;
}

let r2Client: S3Client | null = null;

export async function putR2Object({
  key,
  body,
  contentType,
}: PutR2ObjectInput): Promise<PutR2ObjectResult> {
  const config = getR2Config();
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return {
    bucket: config.bucketName,
    key,
    publicUrl: getR2PublicUrl(key, config),
  };
}

export function getR2SignedDownloadUrl(
  key: string,
  expiresInSeconds = 900
): Promise<string> {
  const config = getR2Config();
  const client = getR2Client();

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

export function getR2SignedUploadUrl({
  key,
  contentType,
  expiresInSeconds = 900,
}: SignedUploadInput): Promise<string> {
  const config = getR2Config();
  const client = getR2Client();

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds }
  );
}

export async function headR2Object(key: string): Promise<R2ObjectHead> {
  const config = getR2Config();
  const client = getR2Client();
  const object = await client.send(
    new HeadObjectCommand({ Bucket: config.bucketName, Key: key })
  );

  return {
    contentType: object.ContentType,
    contentLength: object.ContentLength,
  };
}

export async function getR2Object(key: string): Promise<R2ObjectBody> {
  const config = getR2Config();
  const client = getR2Client();
  const object = await client.send(
    new GetObjectCommand({ Bucket: config.bucketName, Key: key })
  );

  if (!object.Body) {
    throw new Error("R2 object body was empty.");
  }

  return {
    body: await object.Body.transformToByteArray(),
    contentType: object.ContentType,
    contentLength: object.ContentLength,
  };
}

export async function deleteR2Object(key: string): Promise<void> {
  const config = getR2Config();
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucketName, Key: key })
  );
}

export function getR2BucketName(): string {
  return getR2Config().bucketName;
}

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  r2Client = new S3Client({
    region: "auto",
    endpoint: getRequiredEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  return r2Client;
}

function getR2Config(): R2Config {
  return {
    bucketName: getRequiredEnv("R2_BUCKET_NAME"),
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  };
}

function getR2PublicUrl(key: string, config: R2Config): string | undefined {
  if (!config.publicBaseUrl) return undefined;

  return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required R2 environment variable: ${name}`);
  }

  return value;
}
