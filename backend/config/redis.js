const Redis = require("ioredis");

let redisClient;

const connectRedis = () => {
    redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on("connect", () => console.log("Redis connected"));
    redisClient.on("error", (err) => console.error("Redis error:", err));
};

const getRedisClient = () => redisClient;

module.exports = connectRedis;
module.exports.getRedisClient = getRedisClient;
