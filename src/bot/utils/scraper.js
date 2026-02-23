import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const isProduction = process.env.NODE_ENV === 'production';

export const scrapeLinkedInJob = async (url) => {
    let browser = null;
    try {
        let browserOptions;

        if (isProduction) {
            browserOptions = {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            };
        } else {
            const localChromePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            browserOptions = {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: localChromePath,
                headless: 'new',
            };
        }

        browser = await puppeteer.launch(browserOptions);
        const page = await browser.newPage();

        // Mimic a real desktop user to avoid blocks
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });

        // Use networkidle2 so we don't wait forever on tracking scripts
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a bit for dynamic content to render
        await new Promise(r => setTimeout(r, 2000));

        // Attempt to expand "See more" text if present
        try {
            const seeMoreSelectors = [
                'button.see-more-button',
                'button[aria-label="See more"]',
                '.feed-shared-inline-show-more-text__see-more-less-toggle'
            ];
            for (const selector of seeMoreSelectors) {
                const btn = await page.$(selector);
                if (btn) {
                    await page.evaluate(b => b.click(), btn);
                    await new Promise(r => setTimeout(r, 800));
                    break;
                }
            }
        } catch (e) {
            // Ignore if no button is found
        }

        const textContent = await page.evaluate(() => {
            // Try to find the specific LinkedIn post container first
            const postTextDiv = document.querySelector('.update-components-text')
                || document.querySelector('.feed-shared-update-v2__description')
                || document.querySelector('.core-section-container__content');

            if (postTextDiv) {
                return postTextDiv.innerText;
            }

            // Fallback: If not found, get all text but trying to avoid navbars
            const mainContent = document.querySelector('main');
            if (mainContent) return mainContent.innerText;

            return document.body.innerText;
        });

        if (!textContent || textContent.trim().length < 20) {
            throw new Error("Extracted text is too short, possibly blocked by a login wall.");
        }

        return textContent.trim();
    } catch (error) {
        console.error("LinkedIn scrape error:", error.message);
        throw new Error("Failed to fetch content from the URL. LinkedIn might require a login or the link is invalid. Please paste the Job Description directly instead.");
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
