const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const connectRedis = require("./config/redis");
const { errorHandler } = require("./middlewares/errorHandler");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const { xssSanitizer } = require("./middlewares/xssSanitizer");

const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.set("trust proxy", 1); // Trust Render's reverse proxy for accurate IP resolution

connectDB();
connectRedis();

// ── Security Headers ───────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://nanoalias.vercel.app",
            "https://nanoalias.com",
            "https://www.nanoalias.com",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ── Body Parsers ───────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Data Sanitization ──────────────────────────────
app.use(mongoSanitize()); // Prevent NoSQL injection ($gt, $eq, etc.)
app.use(xssSanitizer);    // Strip malicious HTML / <script> tags

// ── Rate Limiters ──────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Please try again in 15 minutes.",
    },
});

// Apply strict limiter to sensitive routes (auth & URL shortening)
app.use("/api/auth", strictLimiter);
app.use("/api/urls", strictLimiter);

// Apply global limiter to all API routes
app.use("/api", globalLimiter);

// ── Routes ─────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

const { redirectUrl } = require("./controllers/urlController");
app.get("/:alias", redirectUrl);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
