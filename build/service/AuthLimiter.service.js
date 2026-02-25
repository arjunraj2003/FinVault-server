"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetLoginAttempts = exports.checkLoginAttempts = void 0;
const redis_connet_1 = require("../config/redis-connet");
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 300;
const checkLoginAttempts = async (userId) => {
    const key = `login:attempts:${userId}`;
    const attempts = Number(await redis_connet_1.redisClient.incr(key));
    if (attempts === 1) {
        await redis_connet_1.redisClient.expire(key, WINDOW_SECONDS);
    }
    if (attempts > MAX_ATTEMPTS) {
        return {
            blocked: true,
            ttl: await redis_connet_1.redisClient.ttl(key)
        };
    }
    return {
        blocked: false,
        remaining: MAX_ATTEMPTS - attempts,
    };
};
exports.checkLoginAttempts = checkLoginAttempts;
const resetLoginAttempts = async (userId) => {
    const key = `login:attempts:${userId}`;
    await redis_connet_1.redisClient.del(key);
};
exports.resetLoginAttempts = resetLoginAttempts;
//# sourceMappingURL=AuthLimiter.service.js.map