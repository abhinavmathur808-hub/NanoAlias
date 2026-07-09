const Redis = require("ioredis");

let redisClient;

const connectRedis = () => {
    // family: 4 forces IPv4 DNS resolution — Render's network struggles with
    // IPv6, which otherwise causes getaddrinfo ENOTFOUND against Upstash.
    redisClient = new Redis(process.env.REDIS_URL, { family: 4 });

    redisClient.on("connect", () => console.log("Redis connected"));
    redisClient.on("error", (err) => console.error("Redis error:", err));
};

const getRedisClient = () => redisClient;

module.exports = connectRedis;
module.exports.getRedisClient = getRedisClient;
