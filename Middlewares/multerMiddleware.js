const multer = require("multer");
const path = require("path");

//define storage space for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, callback) => {
        callback(null, `Image-${file.originalname}-${Date.now()}`);
    },
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
        callback(null, true);
    } else {
        callback(null, false);
    }
};

const multerMiddleware=multer({
    storage,fileFilter
})


module.exports = multerMiddleware