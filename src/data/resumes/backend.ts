import { Resume } from '#models/Resume';

export const backend: Resume = {
    "header": {
        "fullName": "Aamir Hannan",
        "contact": {
            "phone": "+91 9555398835",
            "location": "Bangalore, India",
            "email": "aamirhannansde@gmail.com",
            "links": {
                "linkedin": "LinkedIn",
                "leetcode": "LeetCode",
                "github": "GitHub"
            }
        }
    },
    "professionalSummary": "Backend Engineer with 2 years of experience designing scalable server-side architectures and RESTful APIs. Skilled in building resilient microservices, optimizing SQL and NoSQL databases, and deploying cloud-native applications on AWS. Improved system throughput and reduced latency through Redis caching, asynchronous job queues, and efficient data models. Experienced in collaborating with cross-functional teams to deliver secure, maintainable backend systems supporting thousands of users and powering seamless product experiences.",
    "education": {
        "degree": "Bachelor of Technology (B-Tech)",
        "institution": "Institute of Engineering and Management",
        "duration": {
            "start": "Jul 2019",
            "end": "Jun 2023"
        }
    },
    "technicalSkills": {
        "programmingLanguages": [
            "JavaScript",
            "TypeScript"
        ],
        "backend": [
            "Node.js",
            "Express.js",
            "RESTful APIs",
            "GraphQL"
        ],
        "databases": [
            "PostgreSQL",
            "MySQL",
            "MongoDB",
            "Redis"
        ],
        "devOpsAndTools": [
            "Docker",
            "AWS ECS",
            "Git",
            "Jest",
            "Postman"
        ],
        "middlewareAndServices": [
            "Redis",
            "RabbitMQ",
            "BullMQ",
            "JWT Authentication",
            "OAuth"
        ],
        "architecture": [
            "Microservices",
            "Event-Driven Architecture",
            "Asynchronous Processing",
            "Cloud-Native Systems"
        ]
    },
    "experience": [
        {
            "role": "Software Developer",
            "company": "Llumo AI",
            "employmentType": "Full-time",
            "location": "Remote",
            "duration": {
                "start": "Feb 2024",
                "end": "Present"
            },
            "responsibilitiesAndAchievements": [
                "Developed and optimized RESTful APIs using Node.js and Express, reducing average response time by 70% (from 1.3s to 400ms) across web and mobile platforms.",
                "Consolidated backend service endpoints, reducing API calls per transaction from 4 to 1 and cutting latency by 50% while supporting over 20K active users during peak traffic.",
                "Architected Redis caching layers and asynchronous job queues using BullMQ and RabbitMQ, reducing redundant database queries by 35% and improving scalability under concurrent load.",
                "Engineered fault-tolerant microservices using Docker and deployed on AWS ECS, achieving 99.9% uptime and enabling reliable horizontal scaling.",
                "Improved concurrency handling through event-driven and asynchronous patterns in Node.js, doubling system throughput without performance degradation.",
                "Designed an end-to-end error monitoring and notification pipeline integrating backend logging, client-side fallback UIs, and Slack-based real-time alerts, enabling faster debugging and resolution.",
                "Extended error handling workflows with automated user communication (apology and resolution emails), improving transparency, user trust, and overall experience.",
                "Collaborated with frontend and product teams to deliver backend-driven features that increased user engagement and retention by 40%.",
                "Implemented secure authentication and testing workflows using JWT, OAuth, Jest, and Postman, improving API security, reliability, and test coverage."
            ],
            "technologies": [
                "Node.js",
                "Express.js",
                "Redis",
                "RabbitMQ",
                "BullMQ",
                "Docker",
                "AWS ECS",
                "JWT",
                "OAuth",
                "Jest",
                "Postman"
            ]
        }
    ],
    "projects": [
        {
            "title": "E-Commerce Platform with Microservices Architecture",
            "links": {
                "live": "Live Link"
            },
            "description": [
                "Built a scalable e-commerce platform using React.js for the frontend and Node.js-based microservices for backend operations.",
                "Optimized data fetching using GraphQL and Redux, reducing client-side API calls and improving page load performance by 35%.",
                "Implemented Redis caching and asynchronous processing with RabbitMQ to enhance responsiveness during high-traffic scenarios.",
                "Delivered a modern, responsive UI using Tailwind CSS and CSS-in-JS techniques, ensuring cross-device compatibility and improved Core Web Vitals."
            ],
            "technologyStack": [
                "Node.js",
                "React.js",
                "GraphQL",
                "Redux",
                "Redis",
                "RabbitMQ",
                "Tailwind CSS",
                "CSS-in-JS"
            ]
        }
    ]
}
