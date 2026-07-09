const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { rateLimiter } = require("../middlewares/rateLimiter");
const { getUrlAnalytics, getDashboardStats, askUrlAnalytics } = require("../controllers/analyticsController");

router.get("/dashboard", protect, getDashboardStats);
router.post("/:id/ask", protect, rateLimiter, askUrlAnalytics);
router.get("/:id", protect, getUrlAnalytics);

module.exports = router;
