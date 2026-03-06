const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
    {
        urlId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Url",
            required: [true, "URL reference is required"],
            index: true,
        },
        ipAddress: {
            type: String,
            default: "unknown",
        },
        country: {
            type: String,
            default: "unknown",
        },
        city: {
            type: String,
            default: "unknown",
        },
        deviceType: {
            type: String,
            enum: ["desktop", "mobile", "tablet", "unknown"],
            default: "unknown",
        },
        browser: {
            type: String,
            default: "unknown",
        },
        os: {
            type: String,
            default: "unknown",
        },
        referrer: {
            type: String,
            default: "direct",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);
