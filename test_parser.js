
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api/v1/resume-parser';
const FILE_PATH = 'd:/auto-apply/resume-client/aamir_fullstack_27Jan_2026.pdf';

async function test() {
    try {
        console.log(`Checking file: ${FILE_PATH}`);
        if (!fs.existsSync(FILE_PATH)) {
            throw new Error(`File not found: ${FILE_PATH}`);
        }

        // Step 1: Upload PDF
        console.log('1. Uploading PDF...');
        const form = new FormData();
        form.append('resume', fs.createReadStream(FILE_PATH));

        const uploadRes = await axios.post(`${API_URL}/upload`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        const text = uploadRes.data.text;
        console.log('   Upload successful! Extracted text length:', text.length);

        // Step 2: Convert to Profile
        console.log('\n2. Converting to Profile (this uses LLM, may take a few seconds)...');
        const convertRes = await axios.post(`${API_URL}/convert`, { text });

        console.log('   Conversion successful!');
        // console.log('   Profile JSON:', JSON.stringify(convertRes.data, null, 2));

    } catch (error) {
        console.error('Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

test();
