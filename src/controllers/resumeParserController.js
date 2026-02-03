
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import { llmService } from '../services/llmService.js';
import fs from 'fs';
import { geminiService } from '../services/geminiService.js';

/**
 * Extracts text from an uploaded PDF file.
 * Expects the file to be available in req.file.
 */
export const extractTextFromPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const dataBuffer = fs.readFileSync(req.file.path);

        try {
            // Convert Buffer to Uint8Array for the library
            const uint8Array = new Uint8Array(dataBuffer);

            // Create instance and extract text
            const instance = new PDFParse({ data: uint8Array });
            const data = await instance.getText();

            // Clean up the uploaded file
            fs.unlinkSync(req.file.path);

            return res.status(200).json({ text: data.text });
        } catch (parseError) {
            // Clean up even if parsing fails
            fs.unlinkSync(req.file.path);
            console.error('PDF Parse Error:', parseError);
            return res.status(500).json({ error: 'Failed to parse PDF file' });
        }

    } catch (error) {
        console.error('Extraction Error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Converts raw resume text into a structured job profile format.
 * Expects { text: "..." } in req.body.
 */
export const convertTextToProfile = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        // const structuredProfile = await llmService.parseResumeToProfile(text);
        const structuredProfile = await geminiService.parseResumeToProfile(text);

        if (!structuredProfile) {
            return res.status(500).json({ error: 'Failed to convert text to profile' });
        }

        res.status(200).json(structuredProfile);
    } catch (error) {
        console.error('Conversion Error:', error);
        res.status(500).json({ error: error.message });
    }
};
