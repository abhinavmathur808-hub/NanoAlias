const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const otpSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
otpSchema.index({ email: 1 });

otpSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model("Otp", otpSchema);
