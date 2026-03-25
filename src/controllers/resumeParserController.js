
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
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

        const dataBuffer = req.file.buffer;

        try {
            // Parse PDF data
            const data = await pdfParse(dataBuffer);

            return res.status(200).json({ text: data.text });
        } catch (parseError) {
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
