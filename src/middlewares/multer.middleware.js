import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // This storage needs public/images folder in the root directory
    // Else it will throw an error saying cannot find path public/images
    cb(null, `./public/images`);
  },
  filename: function (req, file, cb) {
    cb(null, `${crypto.randomUUID()}-${file.originalname}`);
  },
});

// Middleware responsible to read form data and upload the File object to the mentioned path
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1000 * 1000,
  },
});
