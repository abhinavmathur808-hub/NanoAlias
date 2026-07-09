const Redis = require("ioredis");

// Instantiate eagerly at module load (not inside connectRedis) so
// getRedisClient() is valid the moment this module is imported, regardless of
// import order. This lets the rate limiter build its RedisStore once at file
// level without crashing before Redis "connects" — ioredis queues commands
// until the connection is established.
// family: 4 forces IPv4 DNS resolution — Render's network struggles with
// IPv6, which otherwise causes getaddrinfo ENOTFOUND against Upstash.
const redisClient = new Redis(process.env.REDIS_URL, { family: 4 });

const connectRedis = () => {
    redisClient.on("connect", () => console.log("Redis connected"));
    redisClient.on("error", (err) => console.error("Redis error:", err));
};

const getRedisClient = () => redisClient;

module.exports = connectRedis;
module.exports.getRedisClient = getRedisClient;
