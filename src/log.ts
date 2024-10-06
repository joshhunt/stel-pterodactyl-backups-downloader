import pino from "pino";
import { DOWNLOAD_LOCATION } from "./config.ts";
import path from "path";

const logOutputFilePath = path.join(DOWNLOAD_LOCATION, "logs.log");

// const combinedTransport = pino.transport({
//   targets: [
//     { target: "pino-pretty" },
//     {
//       pipeline: [
//         { target: "pino-logfmt" },
//         { target: "pino/file", options: { destination: logOutputFilePath } },
//       ],
//     },
//   ],
// });

const logger = pino.default({
  base: null,
  level: "trace",
  transport: {
    targets: [
      {
        level: "info",
        target: "pino-pretty",
        options: {},
      },
      { target: "pino-logfmt", options: { destination: logOutputFilePath } },
    ],
  },
});

export { logger };
