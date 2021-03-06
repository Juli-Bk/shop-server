import multer from 'multer';
import fse from 'fs-extra';

const fileFilter = (req, file, cb) => {
  // Accept file (only json)
  if (file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    // reject file (if not json)
    cb(null, false);
  }
};

const storage = multer.diskStorage({
  filename(req, file, cb) {
    cb(null, file.originalname);
  },

  destination(req, file, cb) {
    const folderName = `./uploads/json${req.baseUrl.split('/').pop()}`;
    fse.mkdirsSync(folderName);
    cb(null, folderName);
  },
});

const uploadJSON = multer({ storage, fileFilter });

export default uploadJSON;
