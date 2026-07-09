const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { getRedisClient } = require("../config/redis");

// Create the limiter once at module load, not per-request. express-rate-limit
// warns (ValidationError) when an instance is built while responding to a
// request. The RedisStore constructor eagerly calls sendCommand (to load its
// Lua script), so this relies on config/redis.js creating the ioredis client
// eagerly — getRedisClient() returns a live (connecting) client at import
// time, and ioredis queues the command until the connection is ready.
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => getRedisClient().call(...args),
    }),
    message: {
        success: false,
        message: "Rate limit exceeded. Please try again in 15 minutes.",
    },
});

exports.rateLimiter = rateLimiter;
