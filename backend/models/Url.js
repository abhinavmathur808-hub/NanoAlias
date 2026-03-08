const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
    {
        originalUrl: {
            type: String,
            required: [true, "Original URL is required"],
            trim: true,
        },
        shortCode: {
            type: String,
            required: [true, "Short code is required"],
            unique: true,
        },
        customAlias: {
            type: String,
            unique: true,
            sparse: true,
            default: undefined,
            trim: true,
            set: (v) => (!v || !v.trim() ? undefined : v),
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        password: {
            type: String,
            default: null,
            select: false,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        oneTimeUse: {
            type: Boolean,
            default: false,
        },
        analytics: {
            totalClicks: { type: Number, default: 0 },
            clicks: [
                {
                    timestamp: { type: Date, default: Date.now },
                    location: { type: String, default: "unknown" },
                    device: { type: String, default: "Desktop" },
                    os: { type: String, default: "unknown" },
                    browser: { type: String, default: "unknown" },
                    referrer: { type: String, default: "direct" },
                },
            ],
        },
        status: {
            type: String,
            enum: ["active", "disabled", "archived"],
            default: "active",
        },
        tags: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);



module.exports = mongoose.model("Url", urlSchema);
