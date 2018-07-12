/**
 * Image File Uploading.
 * ref: https://github.com/expressjs/multer/issues/302
 */
var multer = require('multer');

var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function (req, file, cb) {
   // accept image files only
   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
       return cb(new Error('Only image files are allowed!'), false);
   }
   cb(null, true);
};

var upload = multer({
    storage: storage,
    fileFilter: imageFilter
});

module.exports = upload;
