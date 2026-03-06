/**
 * Global Catch-All Error Handler
 * ───────────────────────────────
 * Must be the LAST app.use() before app.listen().
 * Normalises Mongoose / MongoDB errors into clean JSON responses
 * and hides stack traces in production.
 */
exports.errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // ── Mongoose bad ObjectId (CastError) ──────────
    if (err.name === "CastError") {
        statusCode = 404;
        message = "Resource not found";
    }

    // ── Mongoose duplicate key (code 11000) ────────
    if (err.code === 11000) {
        statusCode = 400;
        message = "Duplicate field value entered";
    }

    // ── Mongoose validation error ──────────────────
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};
