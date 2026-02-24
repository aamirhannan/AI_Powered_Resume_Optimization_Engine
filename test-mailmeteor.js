import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to puppeteer to help bypass Cloudflare / bot detection
puppeteer.use(StealthPlugin());

const main = async () => {
    const targetUrl = 'https://mailmeteor.com/tools/linkedin-email-finder';
    const linkedinProfile = 'https://www.linkedin.com/in/twinkle-kashyap-001736123/';

    console.log("Launching browser...");
    // Launch browser in non-headless mode so you can see what is happening in real-time
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    // Open a new tab
    const page = await browser.newPage();

    try {
        console.log(`Navigating to ${targetUrl}...`);
        // Wait until page fully loads
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("Waiting a few seconds for Cloudflare Turnstile to evaluate...");
        await new Promise(r => setTimeout(r, 5000)); // 5 second pause for safety

        console.log("Looking for the input field...");

        // Mailmeteor's tool page has an input for the LinkedIn URL.
        // We try several common selectors to locate it.
        const inputSelector = 'input[type="url"], input[name*="url" i], input[placeholder*="linkedin" i]';

        await page.waitForSelector(inputSelector, { timeout: 15000 });

        // Type into the input box like a real user
        console.log("Typing the LinkedIn profile into the form...");
        await page.type(inputSelector, linkedinProfile, { delay: 150 });

        console.log("Submitting form...");

        // We look for a button that likely says "Find email" or something similar
        let clicked = false;
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.toLowerCase().includes('find')) {
                await btn.click();
                clicked = true;
                break;
            }
        }

        // If we didn't find the explicit button, just press 'Enter' while focused on the input field
        if (!clicked) {
            console.log("Pressing Enter to submit...");
            await page.keyboard.press('Enter');
        }

        console.log("Processing request... Waiting 30 seconds for search to complete.");
        // The API call underneath might take time, so we pause and let the results appear on screen
        await new Promise(r => setTimeout(r, 30000));

        console.log("Searching the page text for an email address...");

        // Read the entire text contents of the screen
        const pageText = await page.evaluate(() => document.body.innerText);

        // Use a regular expression to find any email addresses string on the screen
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const emailsMatches = pageText.match(emailRegex);

        if (emailsMatches && emailsMatches.length > 0) {
            // Remove duplicates
            const uniqueEmails = [...new Set(emailsMatches)];

            // We can try to exclude common false positives like "support@mailmeteor.com"
            const filteredEmails = uniqueEmails.filter(email => !email.includes('mailmeteor.com'));

            if (filteredEmails.length > 0) {
                console.log("✅ Success! We found these potential emails:");
                console.log(filteredEmails);
            } else {
                console.log("⚠️ Found emails, but they belong to mailmeteor:", uniqueEmails);
            }
        } else {
            console.log("❌ Could not find any email addresses on the page. The search might have failed, required login, or returned no results.");
        }

    } catch (e) {
        console.error("❌ Error during puppeteer automation:", e.message);
    } finally {
        console.log("\nFinished. Leaving the browser open for 15 seconds so you can visually inspect what happened...");
        await new Promise(r => setTimeout(r, 15000));
        await browser.close();
    }
}

main();
