const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");

exports.geoIpTracker = (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const geo = geoip.lookup(ip) || {};

    const ua = new UAParser(req.headers["user-agent"]);
    const browser = ua.getBrowser();
    const os = ua.getOS();
    const device = ua.getDevice();

    req.geoData = {
        ip,
        country: geo.country || "Unknown",
        city: geo.city || "Unknown",
        browser: browser.name || "Unknown",
        os: os.name || "Unknown",
        device: device.type || "desktop",
        referrer: req.headers.referer || "direct",
    };

    next();
};
