import axios from 'axios';

const API_URL = 'http://localhost:5002/api/process-application';

const sampleJobDescription = `
Hi Aamir  ,

Hope you are doing well!!

I am currently hiring for Fullstack Developer for Dubai location, please respond to this email with your CV if you are looking for a job change.



Role: Full Stack Developer

Location: Dubai (Onsite)

Job Type: 12 Months and extendable (On Marc Ellis Payroll)

Notice - Immediate Joiners only



Role Description :-



The full stack developer will be involved in transformation & automation projects within the organization to ensure that successfully deliver these projects on time and within budget, ensuring that the project objectives are met while adhering to PMP standard methodologies/Agile Methodology.



1. Manage the complete software development process from conception to deployment which includes both the front end as well as the back end of websites and applications by applying an in-depth programming expertise, coding, and languages to meet the customers’ requirements.

2. Build new, dynamic, front-end, and backend software products and apps that are dynamic and visually appealing to meet the technical requirements and customer’s expectations.

3. Develop independently entire architecture, responsive design, user interaction, and user experience to meet the digital transformation agenda. Provide ideas and suggestions for ongoing improvement and add or remove features as necessary to meet customer’s expectations.

4. Collaborate with development teams and product managers to create innovative software solutions using the latest advancements in programming languages and server apps. Design a plan for stability, scalability, performance optimization, and ongoing improvement.

5. Explore emerging trends and technologies related to new development in web applications, programming languages, related tools, frameworks, methods, and architectures for continuous improvement.

6. Use project management tools and governance to drive a project from conception to finished product.

7. Lead, coach, and mentor a team of developers involved in multiple projects by providing continuous feedback and driving a culture of innovation, experiment and learning from failures



Key Responsibilities :-



Minimum of 6 years in relevant field.
Proven experience as a Full Stack Developer or similar role with minimum 3 years of experience
Experience developing Web/desktop and mobile applications
Experience with cloud Services like Azure
Experience maintaining API documentation with Postman and Swagger
Experience with multiple Front End Frameworks (like React.js , Vue.js)
Experience with Flutter and DART for creating Mobile and Web applications
Experience with CI/CD, bash script
Knowledge and skills:

Object-oriented analysis and design using common design patterns.
Very strong in Web designing technologies like HTML5, XHTML, CSS3, JavaScript, typescript, jQuery, AJAX and JSON
Components, Directives, Services, View References (Parent/Child/Injection), Routing, Lifecycle processing
Interceptors, HTTP Handlers, Reactive Forms (No template forms)
Understanding concepts of S.O.L.I.D. Principles, IOC/DI, and S.O.C.
LINQ and LAMDA expressions, Regular expression
Knowledge of multiple front-end languages and libraries.
Familiarity with UI/UX design
Familiarity with Azure Services.
Conducting security audits & Code reviews to identify areas of improvement
Ensuring user experience and determining design choices
Should have development of Micro-services experience.
Excellent knowledge of Relational and Non-Relational Databases.
Familiarity with databases (e.g. MySQL), web servers (e.g. NGINX)
Knowledge of multiple back-end technologies Python (Must Have) and good to have (like Node.js, Express.js)
Monitoring network security to ensure that unauthorized users cannot access the database server
Build features and applications with a mobile responsive design.
Excellent communication and teamwork skills

`;

const testApplication = async () => {
    try {
        console.log('🚀 Starting Application Flow Test...');
        console.log('Target URL:', API_URL);

        // Replace with your actual email to see the result, or use a testing inbox
        const targetEmail = 'aamirhannan08@gmail.com';

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
