import multer from "multer";
import path from "path";

// Define the storage location and file naming convention for uploaded photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save uploaded photos to the 'uploads/' directory
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    // Append the current timestamp to the original filename to prevent naming conflicts
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filter to ensure only image files are accepted
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ 
    storage, 
    fileFilter,
    // Restrict file size to a maximum of 5MB to prevent server overload
    limits: { fileSize: 5 * 1024 * 1024 } 
});

export default upload;