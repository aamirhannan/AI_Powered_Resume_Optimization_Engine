import { Resume } from '#models/Resume';

export const softwareEngineer: Resume = {
    "header": {
        "fullName": "Aamir Hannan",
        "contact": {
            "phone": "+91 9555398835",
            "location": "Bangalore, India",
            "email": "aamirhannansde@gmail.com",
            "links": {
                "linkedin": "https://www.linkedin.com/in/aamirhannan/",
                "leetcode": "https://leetcode.com/u/aamir_hannan/",
                "github": "https://github.com/aamirhannan"
            }
        }
    },
    "professionalSummary": "Software Engineer with 2 years of experience architecting high-throughput real-time systems and scalable microservices. Specialized in building reliable asynchronous processing pipelines using Redis Streams, MongoDB Change Streams, and Server-Sent Events to support 20K+ concurrent users with 99.9% uptime. Optimized system performance with 70% response time reduction and 50% latency improvement through Redis caching, query optimization, and endpoint consolidation. Experienced in implementing comprehensive monitoring, security architectures, and cross-functional collaboration to deliver backend-driven features that increased user engagement by 40%",
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
            "TypeScript",
            "Python"
        ],
        "backend": [
            "Node.js",
            "FastAPI",
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
                " Architected a high - throughput real - time data streaming system supporting 20K + concurrent users with 99.9 % uptime, using both MongoDB Change Streams with SSE and Redis Streams with cursor - based polling",

                "Engineered a reliable asynchronous result delivery system without WebSockets, implementing Redis Streams as an append- only event log and guaranteeing exactly - once delivery through monotonic cursor polling",

                "Designed and implemented Server - Sent Events(SSE) endpoint and streaming pipeline for real - time log updates, enabling incremental streaming with auto - reconnect and heartbeat mechanisms",

                "Developed a real - time log update system for users during asynchronous processing, creating multi - channel notification workflows with MongoDB oplog monitoring",

                " Optimized RESTful APIs reducing average response time by 70 % (from 1.3s to 400ms) through query optimization, caching strategies, and endpoint consolidation",

                "Consolidated backend service endpoints, reducing API calls per transaction from 4 to 1 and cutting latency by 50 % while supporting over 20K active users during peak traffic",

                "Implemented Redis caching layers and asynchronous job queues using BullMQ and RabbitMQ, reducing redundant database queries by 35% and improving scalability under concurrent load",

                "Enhanced concurrency handling through event- driven and asynchronous patterns in Node.js, doubling system throughput without performance degradation",

                "Built comprehensive real - time logging and monitoring infrastructure integrating AWS CloudWatch with Slack / email alerts, reducing incident response time by 80%",

                "Implemented fault - tolerant microservices using Docker and AWS ECS, achieving 99.9 % uptime and enabling reliable horizontal scaling",

                "Designed end - to - end error monitoring and notification pipeline integrating backend logging, client - side fallback UIs, and real - time Slack alerts for faster debugging and resolution",

                "Extended error handling workflows with automated user communication(apology and resolution emails), improving transparency and user trust",

                " Implemented rate - limiting architecture using MongoDB and Express.js with multi - layered validation(userID- based primary checks with IP address fallback)",

                "Designed compliance- aligned security architecture that balances user accountability with broader protection mechanisms, resilient under high traffic or malicious load",

                "Engineered production - grade microservices using event-driven architecture, asynchronous processing, and cloud - native principles",

                "Configured secure authentication and testing workflows using JWT, OAuth, Jest, and Postman, improving API security, reliability, and test coverage",

                "Demonstrated reliable async delivery without WebSocket complexity by implementing Redis Streams with cursor - based polling, eliminating connection management overhead",

                "Solved out- of - order task completion, worker crashes, partial failures, and client reconnection issues through deterministic event sourcing patterns",

                "Developed a hybrid approach combining SSE for real - time push with polling for guaranteed delivery, achieving both responsiveness and reliability",

                "Architected systems around polling with strong guarantees rather than push mechanisms, proving that reliability comes from correct modeling of facts and progress",

                "Collaborated with frontend and product teams to deliver backend- driven features that increased user engagement and retention by 40 %",

                "Provided actionable insights for performance optimization and compliance reporting through comprehensive monitoring and data capture",

                "Established scalability foundation supporting growth to 100K + concurrent users through Docker containerization and AWS ECS orchestration",

                "Accelerated development velocity by creating reusable architectural patterns for future feature development",

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
            "title": "AI-Powered Resume Optimization Engine",
            "links": {
                "live": "https://github.com/aamirhannan/AI_Powered_Resume_Optimization_Engine"
            },
            "description": [
                "Architected a modular pipeline system using Design Patterns to orchestrate multi-stage LLM processing (Rewrite → Analyze → Refine), improving resume-job alignment by 40%",
                "Engineered Chain-of-Thought prompting strategies for OpenAI API, implementing recursive self-correction that preserved 100% of original facts while optimizing for ATS",
                "Built PDF generation service with Puppeteer and EJS, reducing manual formatting time from 30 minutes to 2 minutes per resume",
                "Developed REST API processing 100+ resumes with 99.5% success rate, featuring retry mechanisms and validation layers"
            ],
            "technologyStack": [
                "Node.js", "Express.js", "OpenAI GPT-4", "Puppeteer", "Design Patterns", "REST API", "Prompt Engineering"
            ]
        }
    ]
}

