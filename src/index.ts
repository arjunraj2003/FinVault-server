import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./config/data-source";
import { ensureRowLevelSecurity, prepareOwnership } from "./config/ownership";
// import { redisClient } from "./config/redis-connet";

const PORT = process.env.PORT || 4000; 

async function startServer() {
  try {
    // 1. Attach existing rows to their owner, then connect
    await prepareOwnership();
    await AppDataSource.initialize();
    console.log("Database connected");
    await ensureRowLevelSecurity();

    // 2. Connect Redis
    // await redisClient.connect();
    // console.log("Redis connected");

    // 3. Start server only after infra is ready
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1); // Crash fast
  }
}

startServer();
