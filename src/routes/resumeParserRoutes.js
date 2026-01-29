
import express from 'express';
import multer from 'multer';
import { extractTextFromPdf, convertTextToProfile } from '../controllers/resumeParserController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Route to upload a PDF and get extracted text
router.post('/upload', upload.single('resume'), extractTextFromPdf);

// Route to convert extracted text to profile JSON
router.post('/convert', convertTextToProfile);

export default router;
