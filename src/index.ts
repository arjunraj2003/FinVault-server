import app from "./app";
import { AppDataSource } from "./config/data-source";
import { redisClient } from "./config/redis-connet";

const PORT = 3000;

async function startServer() {
  try {
    // 1. Connect DB
    await AppDataSource.initialize();
    console.log("Database connected");

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
