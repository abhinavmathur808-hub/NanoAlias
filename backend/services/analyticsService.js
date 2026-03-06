const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");
const Analytics = require("../models/Analytics");
const Url = require("../models/Url");

exports.logClick = async (req, urlData) => {
    try {
        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.connection?.remoteAddress ||
            "unknown";

        const geo = geoip.lookup(ip) || {};
        const country = geo.country || "unknown";
        const city = geo.city || "unknown";

        const ua = new UAParser(req.headers["user-agent"] || "");
        const browser = ua.getBrowser().name || "unknown";
        const os = ua.getOS().name || "unknown";

        const rawType = (ua.getDevice().type || "").toLowerCase();
        const deviceMap = { mobile: "mobile", tablet: "tablet" };
        const deviceType = deviceMap[rawType] || "desktop";

        const referrer = req.headers.referer || "direct";

        await Analytics.create({
            urlId: urlData._id,
            ipAddress: ip,
            country,
            city,
            deviceType,
            browser,
            os,
            referrer,
        });

        Url.findByIdAndUpdate(urlData._id, { $inc: { clicks: 1 } }).exec();
    } catch (err) {
        console.error("Analytics logClick error:", err.message);
    }
};

exports.getAggregatedStats = async (urlId) => {
    const [byCountry, byBrowser, byDevice, byOS, clicksOverTime] = await Promise.all([
        Analytics.aggregate([{ $match: { urlId } }, { $group: { _id: "$country", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Analytics.aggregate([{ $match: { urlId } }, { $group: { _id: "$browser", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Analytics.aggregate([{ $match: { urlId } }, { $group: { _id: "$deviceType", count: { $sum: 1 } } }]),
        Analytics.aggregate([{ $match: { urlId } }, { $group: { _id: "$os", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Analytics.aggregate([
            { $match: { urlId } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),
    ]);

    return { byCountry, byBrowser, byDevice, byOS, clicksOverTime };
};
