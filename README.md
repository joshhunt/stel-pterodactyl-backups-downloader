Something I threw together quickly to download backups from a Pterodactyl panel. Make no guarantees it actually works. Always test your backups are actually backing up :)

Requires Node 22, and using pnpm.

Create a config.env file, filling in the following values:

```env
STEL_TOKEN=[API token from Pterodactyl panel]
STEL_SERVER_ID=[Server ID, from the URL]
DOWNLOAD_LOCATION=[Absolute location where downloads and logs are saved]
SKIP_BACKUPS=[Comma separated list of backup UUIDs to skip]
```

Run with

```
node --experimental-strip-types --env-file=config.env .\src\index.ts
```
