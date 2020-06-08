import config from './index';
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import fse from 'fs-extra';

const s3Config = new AWS.S3({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    region: 'us-east-1',
});

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
    destination: (req, res, cb) => {
        cb(null, 'src/api/media/profiles')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})

const multerS3Config = multerS3({
    s3: s3Config,
    bucket: config.bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        let route = req.baseUrl.split('/').pop();
        if (route === 'products') {
            // req.body will be empty, if files are sent before fields
            // it is multer bug. see more https://github.com/expressjs/multer/issues/322
            const {categoryBreadcrumbs} = req.body;
            if (categoryBreadcrumbs) {
                route = `${route}/${categoryBreadcrumbs}`;
            }
        }

        const folderName = `img/${route}/${file.originalname}`;
        cb(null, folderName);
    }
});

const uploadAWS = multer({
    storage: multerS3Config,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 20, // we are allowing only 5 MB files
    },
});

export default uploadAWS;