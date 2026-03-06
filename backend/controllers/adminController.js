const User = require("../models/User");
const Url = require("../models/Url");
const AppError = require("../utils/AppError");
const { invalidateCache } = require("../services/redisService");

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "urls",
                    localField: "_id",
                    foreignField: "user",
                    as: "urls",
                },
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    role: 1,
                    isVerified: 1,
                    createdAt: 1,
                    linkCount: { $size: "$urls" },
                },
            },
        ]);
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return next(new AppError("User not found", 404));
        await Url.deleteMany({ user: user._id });
        res.json({ success: true, message: "User and associated URLs deleted" });
    } catch (err) {
        next(err);
    }
};

exports.getAllUrls = async (req, res, next) => {
    try {
        const urls = await Url.find().populate("user", "name email").sort("-createdAt");
        res.json({ success: true, data: urls });
    } catch (err) {
        next(err);
    }
};

exports.toggleUrlStatus = async (req, res, next) => {
    try {
        const url = await Url.findById(req.params.id);
        if (!url) return next(new AppError("URL not found", 404));

        url.status = url.status === "active" ? "disabled" : "active";
        await url.save();

        await invalidateCache(url.shortCode);
        if (url.customAlias) await invalidateCache(url.customAlias);

        res.json({ success: true, data: url });
    } catch (err) {
        next(err);
    }
};
