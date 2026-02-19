import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in production (Render) or local development
const isProduction = process.env.NODE_ENV === 'production';

export const createPDF = async (resumeData) => {
    let browser = null;
    try {
        const templatePath = path.join(__dirname, '../templates/resume-template.ejs');

        // 1. Render HTML from EJS
        const html = await ejs.renderFile(templatePath, resumeData);

        // 2. Configure browser options based on environment
        let browserOptions;

        if (isProduction) {
            // Production: Use @sparticuz/chromium (for Render, Vercel, AWS Lambda, etc.)
            browserOptions = {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            };
        } else {
            // Local Development: Use locally installed Chrome
            // You may need to adjust this path based on your system
            const localChromePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Windows default

            browserOptions = {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: localChromePath,
                headless: 'new',
            };
        }

        // 3. Launch Browser
        browser = await puppeteer.launch(browserOptions);
        const page = await browser.newPage();

        // 4. Set Content
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for Layout Normalizer to finish
        try {
            await page.waitForSelector('body[data-normalized="true"]', { timeout: 2000 });
        } catch (e) {
            console.warn('Layout normalizer timed out, proceeding with default render.');
        }

        // 5. Generate PDF
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

        return pdfBuffer;
    } catch (error) {
        console.error('Error in createPDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};