import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createPDF = async (resumeData) => {
    let browser = null;
    try {
        const templatePath = path.join(__dirname, '../templates/resume-template.ejs');
        const templateContent = fs.readFileSync(templatePath, 'utf-8');

        // 1. Render HTML from EJS
        const html = ejs.render(templateContent, resumeData);

        // 2. Launch Browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // 3. Set Content
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for Layout Normalizer to finish (optional)
        try {
            await page.waitForSelector('body', { timeout: 2000 });
        } catch (e) {
            console.warn('Layout normalizer timed out, proceeding with default render.');
        }

        // 4. Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        await browser.close();
        return pdfBuffer;
    } catch (error) {
        console.error('Error in createPDF:', error);
        if (browser) await browser.close();
        throw error;
    }
};
