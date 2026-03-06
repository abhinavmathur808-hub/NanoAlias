const Analytics = require("../models/Analytics");
const Url = require("../models/Url");
const { getAggregatedStats } = require("../services/analyticsService");
const AppError = require("../utils/AppError");

exports.getUrlAnalytics = async (req, res, next) => {
    try {
        const url = await Url.findOne({ _id: req.params.id, user: req.user.id });
        if (!url) return next(new AppError("URL not found", 404));

        const stats = await getAggregatedStats(url._id);
        res.json({ success: true, data: { url, stats } });
    } catch (err) {
        next(err);
    }
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        const urls = await Url.find({ user: req.user.id });
        const urlIds = urls.map((u) => u._id);
        const totalClicks = await Analytics.countDocuments({ urlId: { $in: urlIds } });

        res.json({ success: true, data: { totalUrls: urls.length, totalClicks } });
    } catch (err) {
        next(err);
    }
};
