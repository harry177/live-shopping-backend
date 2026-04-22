import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  pinoHttp({
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
          }
        : undefined,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  req.log.info("Health check hit");

  res.json({
    ok: true,
  });
});

export default app;