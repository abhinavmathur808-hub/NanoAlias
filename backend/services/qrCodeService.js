const QRCode = require("qrcode");

exports.generateQrCode = async (url) => {
    return QRCode.toDataURL(url);
};
