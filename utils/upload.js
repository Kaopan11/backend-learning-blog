import multer from "multer";

export const multerUpload = multer({
  storage: multer.memoryStorage(),
});
