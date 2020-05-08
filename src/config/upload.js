import multer from "multer";
import fse from "fs-extra";

// Video Type	   Extension	MIME Type
// __________________________________________
// Flash	        .flv	video/x-flv
// MPEG-4	        .mp4	video/mp4
// iPhone Index	    .m3u8	application/x-mpegURL
// iPhone Segment    .ts	video/MP2T
// 3GP Mobile	    .3gp	video/3gpp
// QuickTime	    .mov	video/quicktime
// A/V Interleave	.avi	video/x-msvideo
// Windows Media	.wmv	video/x-ms-wmv

const fileFilter = (req, file, cb) => {
    // Accept file (only jpeg/jpg/png/avi)
    if (file.mimetype === "image/jpeg"
        || file.mimetype === "image/png"
        || file.mimetype === "image/jpg"
        || file.mimetype === "video/quicktime"
        || file.mimetype === "video/x-msvideo"
        || file.mimetype === "video/mp4"
        || file.mimetype === "video/mp3"
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
        const folderName = "./uploads/" + req.baseUrl.split("/").pop();
        fse.mkdirsSync(folderName);
        cb(null, folderName);
    },
    fileFilter: fileFilter
});

const upload = multer({storage: storage});

export default upload;
