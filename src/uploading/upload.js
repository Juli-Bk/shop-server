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
        let route = req.baseUrl.split('/').pop();
        if (route === 'products') {
            // req.body will be empty, if files are sent before fields
            // it is multer bug. see more https://github.com/expressjs/multer/issues/322
            const {categoryBreadcrumbs} = req.body;
            if (categoryBreadcrumbs) {
                route = `${route}/${categoryBreadcrumbs}`;
            }
        }
        const folderName = './uploads/img/' + route;
        fse.mkdirsSync(folderName);
        cb(null, folderName);
    }
});

const upload = multer({storage: storage, fileFilter: fileFilter});

export default upload;
