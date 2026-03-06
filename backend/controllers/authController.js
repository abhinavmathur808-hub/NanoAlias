const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendVerificationEmail, sendPasswordResetEmail, sendOTPVerificationEmail } = require("../services/emailService");
const AppError = require("../utils/AppError");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    });

exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return next(new AppError("Name, email, and password are required", 400));
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError("An account with this email already exists", 409));
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await Otp.deleteMany({ email });

        await Otp.create({ name, email, password, otp });

        await sendOTPVerificationEmail(email, otp);

        res.status(200).json({
            success: true,
            message: "Verification code sent to your email.",
        });
    } catch (err) {
        next(err);
    }
};

exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return next(new AppError("Email and OTP are required", 400));
        }

        const otpDoc = await Otp.findOne({ email });
        if (!otpDoc) {
            return next(new AppError("OTP expired or invalid. Please register again.", 400));
        }

        if (otpDoc.otp !== otp.trim()) {
            return next(new AppError("Invalid verification code. Please try again.", 400));
        }

        const user = new User({
            name: otpDoc.name,
            email: otpDoc.email,
            password: otpDoc.password,
            isVerified: true,
        });
        user.$skipPasswordHash = true;
        await user.save();

        await Otp.deleteMany({ email });

        const token = signToken(user);

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            token,
            user: userResponse,
        });
    } catch (err) {
        next(err);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() },
        });

        if (!user) {
            return next(new AppError("Invalid or expired verification token", 400));
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: "Email verified successfully. You can now log in.",
        });
    } catch (err) {
        next(err);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError("Email and password are required", 400));
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError("Invalid email or password", 401));
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                verified: false,
                message: "Please verify your email before logging in. Complete the OTP verification during registration.",
            });
        }

        const token = signToken(user);

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.verificationToken;
        delete userResponse.verificationTokenExpires;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpire;

        res.json({
            success: true,
            token,
            user: userResponse,
        });
    } catch (err) {
        next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new AppError("Email is required", 400));
        }

        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError("No account found with that email address", 404));
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await Otp.deleteMany({ email });
        await Otp.create({ email, otp });

        await sendOTPVerificationEmail(email, otp);

        res.json({
            success: true,
            message: "Password reset code sent to your email.",
        });
    } catch (err) {
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return next(new AppError("Email, OTP, and new password are required", 400));
        }

        const otpDoc = await Otp.findOne({ email });
        if (!otpDoc) {
            return next(new AppError("OTP expired or invalid. Please try again.", 400));
        }

        if (otpDoc.otp !== otp.trim()) {
            return next(new AppError("Invalid verification code.", 400));
        }

        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError("User not found.", 404));
        }

        user.password = newPassword;
        user.isVerified = true;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        await Otp.deleteMany({ email });

        res.json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (err) {
        next(err);
    }
};

exports.googleLogin = async (req, res, next) => {
    try {
        const { tokenId } = req.body;

        if (!tokenId) {
            return next(new AppError("Google token is required", 400));
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name, sub } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            if (!user.googleId) {
                user.googleId = sub;
            }
            user.isVerified = true;
            await user.save({ validateBeforeSave: false });
        } else {
            const randomPassword = crypto.randomBytes(32).toString("hex");

            user = await User.create({
                name,
                email,
                password: randomPassword,
                googleId: sub,
                isVerified: true,
            });
        }

        const token = signToken(user);

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.verificationToken;
        delete userResponse.verificationTokenExpires;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpire;

        res.json({
            success: true,
            token,
            user: userResponse,
        });
    } catch (err) {
        next(new AppError("Google authentication failed", 401));
    }
};
