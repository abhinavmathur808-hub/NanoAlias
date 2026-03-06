/**
 * Wraps an async controller so that rejected promises are
 * automatically forwarded to the global error handler via next().
 *
 * Usage:
 *   const catchAsync = require("../utils/catchAsync");
 *
 *   exports.getUser = catchAsync(async (req, res) => {
 *       const user = await User.findById(req.params.id);
 *       res.json({ success: true, data: user });
 *   });
 */
module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
