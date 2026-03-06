const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { getUrlAnalytics, getDashboardStats } = require("../controllers/analyticsController");

router.get("/dashboard", protect, getDashboardStats);
router.get("/:id", protect, getUrlAnalytics);

module.exports = router;
