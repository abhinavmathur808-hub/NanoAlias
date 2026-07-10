const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { rateLimiter } = require("../middlewares/rateLimiter");
const { geoIpTracker } = require("../middlewares/geoIpTracker");
const { createShortUrl, redirectUrl, getUserUrls, deleteUrl, updateUrl, unlockUrl, suggestAlias } = require("../controllers/urlController");

router.post("/", protect, rateLimiter, createShortUrl);
router.post("/suggest-alias", protect, rateLimiter, suggestAlias);
router.get("/my", protect, getUserUrls);
router.patch("/:id", protect, updateUrl);
router.delete("/:id", protect, deleteUrl);
router.post("/:shortCode/unlock", unlockUrl);
router.get("/:alias", geoIpTracker, redirectUrl);

module.exports = router;
