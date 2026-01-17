import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const createPDF = async (resumeData) => {
    try {
        const templatePath = path.join(__dirname, '../templates/resume-template.ejs');
        // 1. Render HTML from EJS
        const html = await ejs.renderFile(templatePath, resumeData);
        // 2. Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new', // Type definition for headless sometimes outdated or specific
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        // 3. Set Content
        await page.setContent(html, { waitUntil: 'networkidle0' });
        // Wait for Layout Normalizer to finish
        try {
            await page.waitForSelector('body[data-normalized="true"]', { timeout: 2000 });
        }
        catch (e) {
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
        return Buffer.from(pdfBuffer);
    }
    catch (error) {
        console.error('Error in createPDF:', error);
        throw error;
    }
};
