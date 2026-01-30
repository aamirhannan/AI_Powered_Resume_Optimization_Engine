
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Default to 3000 unless specified otherwise
const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api/process-application`;

const sampleJobDescription = `
Object-oriented analysis and design using common design patterns.
Very strong in Web designing technologies like HTML5, XHTML, CSS3, JavaScript, typescript, jQuery, AJAX and JSON
Components, Directives, Services, View References (Parent/Child/Injection), Routing, Lifecycle processing
Interceptors, HTTP Handlers, Reactive Forms (No template forms)
Understanding concepts of S.O.L.I.D. Principles, IOC/DI, and S.O.C.
`;

const testApplication = async () => {
    try {
        console.log('🚀 Starting Application Flow Test...');
        console.log('Target URL:', API_URL);

        // CONFIGURATION
        // For testing, you can send the email to yourself (Target = Sender)
        const targetEmail = 'a20173959@gmail.com';
        const senderEmail = process.env.PROD_SMTP_EMAIL
        const appPassword = process.env.PROD_SMTP_PASSWORD

        if (!senderEmail || !appPassword || senderEmail.includes('your-sender-email')) {
            console.warn('⚠️  WARNING: Sender credentials are strictly placeholders. Please set PROD_SMTP_EMAIL and PROD_SMTP_PASSWORD in .env or edit this file.');
        }

        const requestBody = {
            role: 'fullstack',
            jobDescription: sampleJobDescription,
            targetEmail: targetEmail,
            senderEmail: senderEmail,
            appPassword: appPassword
        };

        // console.log('Sending request with payload:', {
        //     role: requestBody.role,
        //     targetEmail: requestBody.targetEmail,
        //     senderEmail: requestBody.senderEmail,
        //     appPassword: requestBody.appPassword ? '****** (HIDDEN)' : 'MISSING',
        //     jdPreview: requestBody.jobDescription.substring(0, 50) + '...'
        // });

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

testApplication();
