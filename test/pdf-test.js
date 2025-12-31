// test/pdf-test.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const API_URL = 'http://localhost:5001/api/generate-pdf';
const OUTPUT_FILE = 'test_output_resume.pdf';

const testCase = {
    role: 'frontend',
    jobDescription: `
        We are seeking a Senior React Developer who matches the following criteria:
        - Expert in React.js and Redux for state management.
        - Experience with Next.js for server-side rendering.
        - Proficient in TypeScript and modern JavaScript.
        - Knowledge of Tailwind CSS and Responsive Design.
        - Familiarity with Jest for testing.
        - Ability to lead a team and demonstrate strong communication skills.
    `
}

async function runPdfTest() {
    console.log('--- Starting PDF Generation Test ---');
    console.log(`Target URL: ${API_URL}`);
    console.log(`Role: ${testCase.role} `);
    console.log('Sending Request...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCase)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText} `);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(OUTPUT_FILE, buffer);

        console.log('\n--- Test Result: SUCCESS ---');
        console.log(`PDF saved to: ${path.resolve(OUTPUT_FILE)} `);
        console.log(`File Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('\n--- Test Result: FAILED ---');
        console.error(error.message);
    }
}

runPdfTest();
