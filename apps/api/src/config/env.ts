export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3001),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
};
