import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";
import { randomUUID } from "crypto";
import type { Response } from "express";

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
  stream.on("error", (err) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error streaming file" });
    }
  });
  stream.pipe(res);
}
