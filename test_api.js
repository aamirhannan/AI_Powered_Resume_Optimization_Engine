import axios from 'axios';

const API_URL = 'http://localhost:5002/api/process-application';

const sampleJobDescription = `
About the job
Experience

Minimum 5 years of coding experience in ReactJS (TypeScript), HTML, CSS-Pre-processors, or

CSS-in-JS in creating Enterprise Applications with high performance for Responsive Web

Applications.

Minimum 5 years of coding experience in NodeJS, JavaScript & TypeScript and NoSQL Databases.
Developing and implementing highly responsive user interface components using React

concepts. (self-contained, reusable, and testable modules and components)

Architecting and automating the build process for production, using task runners or scripts
Knowledge of Data Structures for TypeScript.
Monitoring and improving front-end performance.
Banking or Retail domains knowledge is good to have.
Hands on experience in performance tuning, debugging, monitoring.

Technical Skills

Excellent knowledge developing scalable and highly available Restful APIs using NodeJS

technologies

Well versed with CI/CD principles, and actively involved in solving, troubleshooting issues in

distributed services ecosystem

Understanding of containerization, experienced in Dockers, Kubernetes.
Exposed to API gateway integrations like 3Scale.
Understanding of Single-Sign-on or token-based authentication (Rest, JWT, OAuth)
Possess expert knowledge of task/message queues include but not limited to: AWS, Microsoft

Azure, Pushpin and Kafka.

Practical experience with GraphQL is good to have.
Writing tested, idiomatic, and documented JavaScript, HTML and CSS
Experiencing in Developing responsive web-based UI
Have experience on Styled Components, Tailwind CSS, Material UI and other CSS-in-JS

techniques

Thorough understanding of the responsibilities of the platform, database, API, caching layer,

proxies, and other web services used in the system

Writing non-blocking code, and resorting to advanced techniques such as multi-threading, when

needed

Strong proficiency in JavaScript, including DOM manipulation and the JavaScript object model
Documenting the code inline using JSDoc or other conventions
Thorough understanding of React.js and its core principles
Familiarity with modern front-end build pipelines and tools
Experience with popular React.js workflows (such as Flux or Redux or ContextAPI or Data

Structures)


Desired Skills and Experience
JavaScript, React
`;

const testApplication = async () => {
    try {
        console.log('🚀 Starting Application Flow Test...');
        console.log('Target URL:', API_URL);

        // Replace with your actual email to see the result, or use a testing inbox
        const targetEmail = 'waqasbca@gmail.com';
        // const targetEmail = 'gaurav.p@geeksoft.eu';

        const requestBody = {
            role: 'fullstack',
            jobDescription: sampleJobDescription,
            email: targetEmail
        };

        console.log('Sending request with payload:', {
            role: requestBody.role,
            email: requestBody.email,
            jdPreview: requestBody.jobDescription.substring(0, 50) + '...'
        });

        const startTime = Date.now();
        const response = await axios.post(API_URL, requestBody);
        const duration = (Date.now() - startTime) / 1000;

        console.log(`\n✅ Success! (took ${duration.toFixed(2)}s)`);
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('\n❌ Request Failed!');
        console.error('Full Error:', error);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received. Request was made.');
            console.error('Error Code:', error.code);
        } else {
            console.error('Error Message:', error.message);
        }
        console.error('Stack:', error.stack);
    }
};

testApplication();
