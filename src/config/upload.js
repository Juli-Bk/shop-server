import multer from 'multer';
import fse from 'fs-extra';

const fileFilter = (req, file, cb) => {
    // Accept file (only jpeg/jpg/png/avi/...)
    if (file.mimetype === 'image/jpeg'
        || file.mimetype === 'image/png'
        || file.mimetype === 'image/jpg'
        || file.mimetype === 'video/quicktime'
        || file.mimetype === 'video/x-msvideo'
        || file.mimetype === 'video/mp4'
        || file.mimetype === 'video/mp3'
    ) {
        cb(null, true);
    } else {
        // reject file (if not jpeg/jpg/png)
        cb(null, false);
    }
};

const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
    destination: function (req, file, cb) {
        const folderName = './uploads/' + req.baseUrl.split('/').pop();
        fse.mkdirsSync(folderName);
        cb(null, folderName);
    }
});

const upload = multer({storage: storage, fileFilter: fileFilter});

export default upload;
