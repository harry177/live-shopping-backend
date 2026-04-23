import "./config/load-env";

import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { stopExpiredStreams } from "./services/stream.service";

app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});

setInterval(async () => {
  try {
    await stopExpiredStreams();
  } catch (error) {
    logger.error({ error }, "Failed to stop expired streams");
  }
}, 5000);