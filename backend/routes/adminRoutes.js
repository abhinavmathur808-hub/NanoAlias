const router = require("express").Router();
const { protect, admin } = require("../middlewares/authMiddleware");
const { getAllUsers, deleteUser, getAllUrls, toggleUrlStatus } = require("../controllers/adminController");

router.use(protect, admin);

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/urls", getAllUrls);
router.patch("/urls/:id/status", toggleUrlStatus);

module.exports = router;
