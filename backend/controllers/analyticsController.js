const Analytics = require("../models/Analytics");
const Url = require("../models/Url");
const { getAggregatedStats } = require("../services/analyticsService");
const { askAnalytics } = require("../services/geminiService");
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

exports.askUrlAnalytics = async (req, res, next) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return next(new AppError("A question is required", 400));
        }
        if (question.length > 500) {
            return next(new AppError("Question is too long (max 500 characters)", 400));
        }

        const url = await Url.findOne({ _id: req.params.id, user: req.user.id });
        if (!url) return next(new AppError("URL not found", 404));

        const stats = await getAggregatedStats(url._id);

        // Referrer breakdown isn't in the aggregation, so derive it from the
        // embedded click log for a richer context.
        const referrers = {};
        (url.analytics?.clicks || []).forEach((c) => {
            const key = c.referrer || "direct";
            referrers[key] = (referrers[key] || 0) + 1;
        });

        const context = {
            shortLink: url.customAlias || url.shortCode,
            destination: url.originalUrl,
            createdAt: url.createdAt,
            totalClicks: url.analytics?.totalClicks || 0,
            clicksByCountry: stats.byCountry,
            clicksByBrowser: stats.byBrowser,
            clicksByDevice: stats.byDevice,
            clicksByOS: stats.byOS,
            clicksByDate: stats.clicksOverTime,
            clicksByReferrer: Object.entries(referrers).map(([_id, count]) => ({ _id, count })),
        };

        const result = await askAnalytics(question.trim(), context);
        if (!result.ok) {
            return next(new AppError(result.message, result.status));
        }

        res.json({ success: true, answer: result.answer });
    } catch (err) {
        next(err);
    }
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        const urls = await Url.find({ user: req.user.id });
        const urlIds = urls.map((u) => u._id);
        const totalClicks = await Analytics.countDocuments({ urlId: { $in: urlIds } });
        const activeLinks = urls.filter((u) => u.status === "active" && (!u.expiresAt || new Date(u.expiresAt) >= new Date())).length;
        const burnLinks = urls.filter((u) => u.oneTimeUse).length;

        res.json({
            success: true,
            data: { totalLinks: urls.length, totalClicks, activeLinks, burnLinks },
        });
    } catch (err) {
        next(err);
    }
};
