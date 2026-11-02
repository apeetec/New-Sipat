import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { checkDatabase, pool } from "./database/pool.js";
async function start() {
  await checkDatabase();
  const server = createServer(createApp());
  server.listen(env.PORT, env.HOST, () =>
    logger.info(
      { host: env.HOST, port: env.PORT, environment: env.NODE_ENV },
      "SIPAT API iniciada",
    ),
  );
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Encerrando API");
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}
start().catch((error) => {
  logger.fatal({ err: error }, "Falha ao iniciar API");
  process.exit(1);
});
