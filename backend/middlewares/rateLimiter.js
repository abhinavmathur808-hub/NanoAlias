const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { getRedisClient } = require("../config/redis");

let limiter;

exports.rateLimiter = (req, res, next) => {
    if (!limiter) {
        limiter = rateLimit({
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
    }
    return limiter(req, res, next);
};
