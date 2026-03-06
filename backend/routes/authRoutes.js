const router = require("express").Router();
const {
    registerUser,
    loginUser,
    verifyEmail,
    verifyOTP,
    forgotPassword,
    resetPassword,
    googleLogin,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
