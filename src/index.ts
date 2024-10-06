import { PteroClient } from "@devnote-dev/pterojs";
import filenamify from "filenamify";
import {
  DOWNLOAD_LOCATION,
  SKIP_BACKUPS,
  STEL_SERVER_ID,
  STEL_TOKEN,
} from "./config.ts";
import { readdir, writeFile } from "fs/promises";
import { logger } from "./log.ts";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import path from "path";

logger.info("Wakey wakey, hands off snakey!");

const client = new PteroClient("https://control.stelhosting.com", STEL_TOKEN);

const server = await client.servers.fetch(STEL_SERVER_ID);
logger.info({ name: server.name, uuid: server.uuid }, "Loaded server");

const backups = await server.backups.fetch();
logger.info({ count: backups.size }, "Loaded backups");
for (const [, backup] of backups) {
  logger.info({ ...backup }, "Loaded backup");
}

const alreadyDownloadedFiles = (await readdir(DOWNLOAD_LOCATION)).filter(
  (v) => {
    return !(v.endsWith(".json") || v.endsWith(".log"));
  }
);

for (const [, backup] of backups) {
  const backupLogger = logger.child({ backupUUID: backup.uuid });

  if (!backup.successful) {
    backupLogger.info("Skipping unsuccessful backup");
    continue;
  }

  if (SKIP_BACKUPS.includes(backup.uuid)) {
    backupLogger.info("Skipping backup due to SKIP_BACKUPS");
    continue;
  }

  const safeName = filenamify(backup.name, { replacement: "_" });
  const baseFileName = `${safeName}__${backup.uuid}`;

  const alreadyDownloaded = alreadyDownloadedFiles.find((v) =>
    v.includes(backup.uuid)
  );
  if (alreadyDownloaded) {
    backupLogger.info(
      { localFileName: alreadyDownloaded },
      `Skipping already downloaded backup`
    );
    continue;
  }

  const downloadURL = await server.backups.getDownloadURL(backup.uuid);
  const downloadURLPathName = new URL(downloadURL).pathname;
  const extension = downloadURLPathName.endsWith(".tar.gz")
    ? ".tar.gz"
    : path.parse(downloadURLPathName).ext;
  const downloadFileName = baseFileName + extension;
  const downloadDest = path.join(DOWNLOAD_LOCATION, downloadFileName);
  const jsonDest = path.join(DOWNLOAD_LOCATION, `${baseFileName}.json`);
  const jsonContent = JSON.stringify(
    { backup, localFileName: downloadFileName },
    null,
    2
  );

  backupLogger.info({ downloadURL, downloadDest }, "Downloading backup");

  const [success, errResponse] = await downloadFile(
    downloadURL,
    downloadDest,
    (bytesWritten) => {
      backupLogger.info(
        { bytesWritten, totalBytes: backup.bytes },
        "Download in progress"
      );
    }
  );

  if (!success) {
    backupLogger.error(
      { statusText: errResponse.statusText },
      "Failed to download backup"
    );
  }

  await writeFile(jsonDest, jsonContent);

  backupLogger.info({ downloadDest }, "Backup downloaded successfully");
}

async function downloadFile(
  downloadURL: string,
  downloadDest: string,
  progressCallback: (bytesWritten: number) => void
): Promise<[true, undefined] | [false, Response]> {
  const response = await fetch(downloadURL);
  if (!response.ok || !response.body) {
    return [false, response];
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
