const { nanoid } = require("nanoid");

exports.generateShortCode = (length = 8) => nanoid(length);
