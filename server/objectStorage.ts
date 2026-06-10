import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import type { Response } from "express";

// GCS client authenticated through the Replit sidecar (the only piece this
// module needed from the removed replit_integrations/object_storage bundle).
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function getPublicBucketAndPrefix(): { bucketName: string; prefix: string } {
  const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
  const firstPath = pathsStr.split(",")[0]?.trim();
  if (!firstPath) {
    throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not set");
  }
  const parts = firstPath.replace(/^\//, "").split("/");
  const bucketName = parts[0];
  const prefix = parts.slice(1).join("/");
  return { bucketName, prefix };
}

export async function uploadBuffer(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const key = randomUUID();
  const { bucketName, prefix } = getPublicBucketAndPrefix();
  const objectName = prefix ? `${prefix}/media/${key}` : `media/${key}`;

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  return `/api/media/${key}`;
}

export async function uploadBufferWithKey(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { bucketName, prefix } = getPublicBucketAndPrefix();
  const objectName = prefix ? `${prefix}/media/${key}` : `media/${key}`;

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  return `/api/media/${key}`;
}

export async function objectExists(key: string): Promise<boolean> {
  const { bucketName, prefix } = getPublicBucketAndPrefix();
  const objectName = prefix ? `${prefix}/media/${key}` : `media/${key}`;
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  const [exists] = await file.exists();
  return exists;
}

// Read a stored object and return it as a base64 data URL. Used to feed
// object-storage images (which are not publicly fetchable) into the vision model.
export async function getObjectDataUrl(key: string): Promise<string> {
  const { bucketName, prefix } = getPublicBucketAndPrefix();
  const objectName = prefix ? `${prefix}/media/${key}` : `media/${key}`;
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`Object not found: ${key}`);
  }
  const [metadata] = await file.getMetadata();
  const contentType = (metadata.contentType as string) || "image/png";
  const [buffer] = await file.download();
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export async function uploadFromUrl(sourceUrl: string): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }
  const contentType =
    response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return uploadBuffer(buffer, contentType);
}

export async function streamObject(
  key: string,
  res: Response
): Promise<void> {
  const { bucketName, prefix } = getPublicBucketAndPrefix();
  const objectName = prefix ? `${prefix}/media/${key}` : `media/${key}`;

  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  const [exists] = await file.exists();
  if (!exists) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [metadata] = await file.getMetadata();
  res.set({
    "Content-Type": (metadata.contentType as string) || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  const stream = file.createReadStream();
  stream.on("error", (err: any) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error streaming file" });
    }
  });
  stream.pipe(res);
}
