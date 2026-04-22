import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});
