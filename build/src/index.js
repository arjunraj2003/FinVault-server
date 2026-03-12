"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const data_source_1 = require("./config/data-source");
// import { redisClient } from "./config/redis-connet";
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        // 1. Connect DB
        await data_source_1.AppDataSource.initialize();
        console.log("Database connected");
        // 2. Connect Redis
        // await redisClient.connect();
        // console.log("Redis connected");
        // 3. Start server only after infra is ready
        app_1.default.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Startup failed:", error);
        process.exit(1); // Crash fast
    }
}
startServer();
//# sourceMappingURL=index.js.map