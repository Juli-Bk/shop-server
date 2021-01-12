import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import config from '../config';
import { log } from '../helpers/helper';

const s3Config = new AWS.S3({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  Bucket: config.bucket,
  ContentDisposition: 'inline',
  region: 'eu-central-1', // or might be 'eu-west-3'

  // Body: file,
});

const fileFilter = (req, file, cb) => {
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
    // reject file (if not image/video)
    log(`rejected file for request: ${JSON.stringify(req)}`);
    cb(null, false);
  }
};

const multerS3Config = multerS3({
  s3: s3Config,
  bucket: config.bucket,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  acl: 'public-read',
  contentDisposition: 'inline',
  metadata(req, file, cb) {
    cb(null, { ...req.body });
  },

  key(req, file, cb) {
    const { productId } = req.body;
    let route = req.baseUrl.split('/').pop();
    if (route === 'products') {
      // req.body will be empty, if files are sent before fields
      // it is multer bug. see more https://github.com/expressjs/multer/issues/322
      const { categoryBreadcrumbs } = req.body;
      if (categoryBreadcrumbs) {
        route = `${route}/${categoryBreadcrumbs}/${productId}/`;
      }
    }

    const folderName = `img/${route}/${file.originalname}`;
    cb(null, folderName);
  },
});

const uploadAWS = multer({
  storage: multerS3Config,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 20, // we are allowing only 5 MB files
  },
});

export default uploadAWS;
