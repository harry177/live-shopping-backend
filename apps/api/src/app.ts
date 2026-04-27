import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./config/logger";
import routes from "./routes";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  pinoHttp({
    logger,
  })
);

app.use(
  "/recordings",
  express.static("/recordings", {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader(
        "Access-Control-Allow-Origin",
        "https://shopping-stream.netlify.app",
      );
      res.setHeader("Accept-Ranges", "bytes");
    },
  }),
);

app.use(express.json());

app.use(routes);

export default app;