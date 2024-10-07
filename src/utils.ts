import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { logger } from "./log.ts";

export function getExtensionFromURL(url: string): string | undefined {
  const parsedURL = new URL(url);
  const pathname = parsedURL.pathname;
  const extensionMatch = pathname.match(/\..*$/);
  return extensionMatch?.[0];
}

export function updateFileExtension(
  originalPath: string,
  headerFilename: string
): string {
  const extensionMatch = headerFilename.match(/\..*$/);
  if (!extensionMatch) {
    return originalPath;
  }

  const newExtension = extensionMatch[0];
  const fileName = originalPath.split(".")[0];
  return fileName + newExtension;
}

export function getRemoteFilename(response: Response): string | undefined {
  const contentDisposition = response.headers.get("content-disposition");
  if (!contentDisposition) {
    return undefined;
  }

  const regex = /filename="?([^"]+)"?/;
  const match = contentDisposition.match(regex);
  return match?.[1];
}

export async function downloadFile(
  downloadURL: string,
  downloadDestParam: string,
  progressCallback: (bytesWritten: number) => void
): Promise<[true, undefined] | [false, Response]> {
  const response = await fetch(downloadURL);
  if (!response.ok || !response.body) {
    return [false, response];
  }

  // Extract filename from content-disposition header
  const remoteFilename = getRemoteFilename(response);
  let downloadDest = downloadDestParam;
  if (remoteFilename) {
    downloadDest = updateFileExtension(downloadDestParam, remoteFilename);
    logger.info(
      { origDest: downloadDestParam, newDest: downloadDest },
      "Renamed download destination from header"
    );
  }

  const fileStream = createWriteStream(downloadDest);

  const interval = setInterval(() => {
    progressCallback(fileStream.bytesWritten);
  }, 5 * 1000);

  await pipeline(response.body, fileStream).finally(() => {
    clearInterval(interval);
  });

  return [true, undefined];
}
