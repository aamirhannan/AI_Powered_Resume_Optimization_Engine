
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Default to 3000 unless specified otherwise (matching test_api.js logic)
// The user might be running on 5002 as seen in previous logs, but typically we respect env or default.
// I'll check process.env.PORT, otherwise default to 5002 since I saw that in logs, or 3000.
// Let's stick to the pattern in test_api.js which uses PORT env var.

const PORT = process.env.PORT || 3000;
// Note: If you are running on 5002 manually, ensure .env has PORT=5002 or change this line.
const API_URL = `http://localhost:${PORT}/api/retry-failed`;

const testRetry = async () => {
    try {
        console.log('🚀 Starting Retry Failed Applications Test...');
        console.log('Target URL:', API_URL);

        const senderEmail = process.env.PROD_SMTP_EMAIL;
        const appPassword = process.env.PROD_SMTP_PASSWORD;

        if (!senderEmail || !appPassword) {
            console.error('❌ Error: PROD_SMTP_EMAIL and PROD_SMTP_PASSWORD are required in .env for this test.');
            process.exit(1);
        }

        const requestBody = {
            senderEmail: senderEmail,
            appPassword: appPassword
        };

        console.log('Sending retry request for:', senderEmail);

        const startTime = Date.now();
        const response = await axios.post(API_URL, requestBody);
        const duration = (Date.now() - startTime) / 1000;

        console.log(`\n✅ Success! (took ${duration.toFixed(2)}s)`);
        console.log('Response Status:', response.status);
        // console.log('Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('\n❌ Request Failed!');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received. Server might be down or unreachable.');
            console.error('Error Code:', error.code);
        } else {
            console.error('Error Message:', error.message);
        }
    }
};

testRetry();
