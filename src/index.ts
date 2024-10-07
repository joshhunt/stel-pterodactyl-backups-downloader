import { type Backup, ClientServer, PteroClient } from "@devnote-dev/pterojs";
import filenamify from "filenamify";
import {
  DOWNLOAD_LOCATION,
  SKIP_BACKUPS,
  STEL_SERVER_ID,
  STEL_TOKEN,
} from "./config.ts";
import { readdir, writeFile } from "fs/promises";
import { logger } from "./log.ts";
import path from "path";
import { downloadFile, getExtensionFromURL } from "./utils.ts";

async function processBackup(
  server: ClientServer,
  backup: Backup,
  alreadyDownloadedFiles: string[]
) {
  const backupLogger = logger.child({ backupUUID: backup.uuid });
  backupLogger.info({ ...backup }, "Processing backup");

  if (!backup.successful || SKIP_BACKUPS.includes(backup.uuid)) {
    backupLogger.info("Skipping backup");
    return;
  }

  if (alreadyDownloadedFiles.some((v) => v.includes(backup.uuid))) {
    backupLogger.info("Skipping already downloaded backup");
    return;
  }

  const downloadURL = await server.backups.getDownloadURL(backup.uuid);

  const safeName = filenamify(backup.name, { replacement: "_" });
  const baseFileName = `${safeName}__${backup.uuid}`;
  const downloadFileName =
    baseFileName + (getExtensionFromURL(downloadURL) ?? "");
  const downloadDest = path.join(DOWNLOAD_LOCATION, downloadFileName);

  backupLogger.info({ downloadURL, downloadDest }, "Downloading backup");

  const progressLogger = (bytesWritten: number) => {
    backupLogger.info(
      { bytesWritten, totalBytes: backup.bytes },
      "Download in progress"
    );
  };

  const [successfulDest, errResponse] = await downloadFile(
    downloadURL,
    downloadDest,
    progressLogger
  );

  if (!successfulDest) {
    backupLogger.error(
      { statusText: errResponse.statusText },
      "Failed to download backup"
    );
  }

  const jsonDest = path.join(DOWNLOAD_LOCATION, `${baseFileName}.json`);
  const jsonContent = JSON.stringify(
    { backup, localFileName: downloadFileName },
    null,
    2
  );
  await writeFile(jsonDest, jsonContent);

  backupLogger.info({ successfulDest }, "Backup downloaded successfully");
}

async function main() {
  logger.info("Wakey wakey, hands off snakey!");

  const client = new PteroClient("https://control.stelhosting.com", STEL_TOKEN);
  const server = await client.servers.fetch(STEL_SERVER_ID);
  logger.info({ name: server.name, uuid: server.uuid }, "Loaded server");

  const backups = await server.backups.fetch();
  logger.info({ count: backups.size }, "Loaded backups");

  const alreadyDownloadedFiles = await readdir(DOWNLOAD_LOCATION);

  for (const [, backup] of backups) {
    try {
      await processBackup(server, backup, alreadyDownloadedFiles);
    } catch (error) {
      logger.error(
        { error, backupUUID: backup.uuid },
        "An error occurred while processing backup"
      );
    }
  }
}

// 3. Use the main function
main().catch((error) => {
  logger.error(error, "An error occurred during execution");
  process.exit(1);
});
