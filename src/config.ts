function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not defined`);
  }
  return value;
}

const STEL_TOKEN = getEnvVariable("STEL_TOKEN");
const STEL_SERVER_ID = getEnvVariable("STEL_SERVER_ID");
const DOWNLOAD_LOCATION = getEnvVariable("DOWNLOAD_LOCATION");

const SKIP_BACKUPS = process.env.SKIP_BACKUPS
  ? process.env.SKIP_BACKUPS.split(",")
  : [];

export { STEL_TOKEN, STEL_SERVER_ID, DOWNLOAD_LOCATION, SKIP_BACKUPS };
