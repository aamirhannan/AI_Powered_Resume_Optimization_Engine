
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/resumeGenerationDatabaseController.js';
import { getResumeByRole } from '../services/resumeLoader.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { createPDF } from '../services/pdfGenerator.js';
import { RewriteResumeViaLLM } from '../pipeline/steps/recrute-outreach-via-email/RewriteResumeViaLLM.js';
import { CriticalAnalysis } from '../pipeline/steps/recrute-outreach-via-email/CriticalAnalysis.js';
import { EvidenceBasedRefinement } from '../pipeline/steps/recrute-outreach-via-email/EvidenceBasedRefinement.js';
import { InsertNewlyCreatedResumePoints } from '../pipeline/steps/recrute-outreach-via-email/InsertNewlyCreatedResumePoints.js';
import { uploadResumePDF } from '../services/storageService.js';
import fs from 'fs';
import { snakeToCamel } from './utils.js';

export const getResumeGeneration = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchResumeGenerations(supabase);
        const response = data.map((item) => snakeToCamel(item))
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



export const createResumeGeneration = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { role, jobDescription } = req.body;


        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        const baseResume = getResumeByRole(role);

        // Execute Pipeline to get optimized data
        const pipeline = new Pipeline()
            .addStep(new RewriteResumeViaLLM())
            .addStep(new CriticalAnalysis())
            .addStep(new EvidenceBasedRefinement())
            .addStep(new InsertNewlyCreatedResumePoints());

        const result = await pipeline.execute({
            resume: baseResume,
            jobDescription,
            tokenUsage: { input: 0, output: 0, total: 0, cost: 0 }
        });

        // Generate PDF
        const evidenceBasedResume = await createPDF(result.evidenceBasedRefinementResult);


        // const evidenceBasedResume = await createPDF({
        //     "header": {
        //         "fullName": "Aamir Hannan",
        //         "contact": {
        //             "phone": "+91 9555398835",
        //             "location": "Bangalore, India",
        //             "email": "aamirhannansde@gmail.com",
        //             "links": {
        //                 "linkedin": "LinkedIn",
        //                 "leetcode": "LeetCode",
        //                 "github": "GitHub"
        //             }
        //         }
        //     },
        //     "professionalSummary": "Frontend Engineer with over 2 years of experience building scalable, high-performance web applications using React, Next.js, and TypeScript. Specialized in optimizing frontend rendering and load times through client-side caching, code splitting, and lazy loading. Achieved a 20% increase in user engagement and a 70% reduction in API response times through efficient state management and resilient caching strategies. Passionate about building accessible, responsive user interfaces with pixel-perfect design, intuitive UX, and long-term maintainability at scale.",
        //     "education": {
        //         "degree": "Bachelor of Technology (B-Tech)",
        //         "institution": "Institute of Engineering and Management",
        //         "duration": {
        //             "start": "Jul 2019",
        //             "end": "Jun 2023"
        //         }
        //     },
        //     "technicalSkills": {
        //         "programmingLanguages": [
        //             "JavaScript",
        //             "TypeScript",
        //             "Python",
        //             "HTML",
        //             "CSS"
        //         ],
        //         "frontend": [
        //             "React.js",
        //             "Next.js",
        //             "Redux",
        //             "Context API",
        //             "Jotai",
        //             "TanStack Query",
        //             "DOM Manipulation",
        //             "Tailwind CSS",
        //             "CSS-in-JS",
        //             "Styled Components",
        //             "Material UI",
        //             "Lucid UI"
        //         ],
        //         "performanceAndTesting": [
        //             "Client-side caching",
        //             "State management",
        //             "Jest",
        //             "React Testing Library",
        //             "Performance tuning",
        //             "Debugging"
        //         ],
        //         "backendAndDatabases": [
        //             "Node.js",
        //             "Express.js",
        //             "RESTful APIs",
        //             "GraphQL",
        //             "MongoDB",
        //             "MySQL",
        //             "PostgreSQL"
        //         ],
        //         "devOpsAndTools": [
        //             "Docker",
        //             "AWS",
        //             "CI/CD",
        //             "Git",
        //             "Build Automation"
        //         ],
        //         "architectureAndMiddleware": [
        //             "Microservices",
        //             "API Gateways",
        //             "Caching",
        //             "Proxies",
        //             "Redis",
        //             "RabbitMQ",
        //             "Kafka",
        //             "JWT Authentication",
        //             "OAuth",
        //             "SSO"
        //         ]
        //     },
        //     "experience": [
        //         {
        //             "role": "Software Developer",
        //             "company": "Llumo AI",
        //             "employmentType": "Full-time",
        //             "location": "Remote",
        //             "duration": {
        //                 "start": "Feb 2024",
        //                 "end": "Present"
        //             },
        //             "responsibilitiesAndAchievements": [
        //                 "Improved frontend performance by reducing API response time by 70% (from 1.3s to 400ms) through optimized state management using TanStack Query and React Query, directly improving page load speed and user engagement.",
        //                 "Designed and implemented a modular React component architecture, increasing code reusability and maintainability while reducing frontend production bugs by 17%.",
        //                 "Optimized client-server communication by consolidating multiple API calls into a single endpoint using Next.js and TypeScript, reducing latency by 50% and improving UI responsiveness.",
        //                 "Built a custom client-side caching system using Context API, reducing redundant re-renders and improving page load times by 20%.",
        //                 "Collaborated with backend engineers to design scalable REST APIs using Node.js and Express, ensuring seamless frontend-backend integration and supporting growth to over 20K active users."
        //             ],
        //             "technologies": [
        //                 "React.js",
        //                 "Next.js",
        //                 "TypeScript",
        //                 "TanStack Query",
        //                 "React Query",
        //                 "Context API",
        //                 "Node.js",
        //                 "Express.js"
        //             ]
        //         }
        //     ],
        //     "projects": [
        //         {
        //             "title": "E-Commerce Platform with Microservices Architecture",
        //             "links": {
        //                 "live": "Live Link"
        //             },
        //             "description": [
        //                 "Built a scalable e-commerce platform using React.js for the frontend and Node.js-based microservices for backend services, supporting dynamic product listings and checkout flows.",
        //                 "Optimized data fetching using GraphQL and Redux, reducing client-side API calls and improving page load performance by 35%.",
        //                 "Implemented Redis caching and asynchronous processing with RabbitMQ to improve responsiveness during high-traffic scenarios.",
        //                 "Delivered a modern, responsive UI using Tailwind CSS and CSS-in-JS, ensuring cross-device compatibility and improved Core Web Vitals."
        //             ],
        //             "technologyStack": [
        //                 "React.js",
        //                 "Node.js",
        //                 "GraphQL",
        //                 "Redux",
        //                 "Redis",
        //                 "RabbitMQ",
        //                 "Tailwind CSS",
        //                 "CSS-in-JS"
        //             ]
        //         },
        //         {
        //             "title": "Performance Dashboard for Real-Time Analytics",
        //             "links": {
        //                 "github": "GitHub"
        //             },
        //             "description": [
        //                 "Developed a real-time performance monitoring dashboard using Next.js, React Query, and WebSockets to visualize live metrics with sub-second updates.",
        //                 "Reduced JavaScript bundle size by 28% using code splitting, lazy loading, and tree-shaking, resulting in faster initial load times and improved Lighthouse scores.",
        //                 "Implemented JWT-based authentication and role-based access control for secure metric visualization.",
        //                 "Designed responsive UI components using Material UI, ensuring smooth UX across desktop and mobile devices."
        //             ],
        //             "technologyStack": [
        //                 "Next.js",
        //                 "React.js",
        //                 "React Query",
        //                 "WebSockets",
        //                 "JWT",
        //                 "Material UI"
        //             ]
        //         }
        //     ]
        // })

        // Upload PDF to Supabase Storage
        // const pdfPath = await uploadResumePDF(supabase, req.user.id, evidenceBasedResume);

        // Create entry in generated_resumes table first (Parent table)
        // const generatedResumeEntry = {
        //     file_path: "",
        //     content: "",
        //     // master_resume_id: ... // We don't have this comfortably available right now, skipping as nullable
        // };

        // const savedGeneratedResume = await generatedResumeDbController.insertGeneratedResume(supabase, generatedResumeEntry, req.user.id);

        const generationData = {
            // generated_resume_id: savedGeneratedResume.id,
            role,
            prev_resume_content: baseResume,
            new_resume_content: result.evidenceBasedRefinementResult,
            status: "SUCCESS",
        };

        await dbController.createResumeGeneration(supabase, generationData, req.user.id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': evidenceBasedResume.length,
            'Content-Disposition': `attachment; filename="Resumes_${role || 'Optimized'}.pdf"`,
            'X-Token-Usage-Cost': result.tokenUsage?.cost?.toFixed(4) || '0',
            'X-Token-Input': result.tokenUsage?.input || '0',
            'X-Token-Output': result.tokenUsage?.output || '0'
        });

        res.send(evidenceBasedResume);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


export const updateResumeGeneration = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { id, role, jobDescription } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID is required' });
        }

        const baseResume = getResumeByRole(role);

        // Execute Pipeline to get optimized data
        const pipeline = new Pipeline()
            .addStep(new RewriteResumeViaLLM())
            .addStep(new CriticalAnalysis())
            .addStep(new EvidenceBasedRefinement())
            .addStep(new InsertNewlyCreatedResumePoints());

        const result = await pipeline.execute({
            resume: baseResume,
            jobDescription,
            tokenUsage: { input: 0, output: 0, total: 0, cost: 0 }
        });

        // Generate PDF
        const evidenceBasedResume = await createPDF(result.evidenceBasedRefinementResult);

        // Upload PDF to Supabase Storage
        const pdfPath = await uploadResumePDF(supabase, req.user.id, evidenceBasedResume);

        // Update entry in generated_resumes table
        const updatedGeneratedResume = await generatedResumeDbController.updateGeneratedResume(supabase, id, pdfPath);

        const generationData = {
            // generated_resume_id: updatedGeneratedResume.id,
            role,
            prev_resume_content: baseResume,
            new_resume_content: result.evidenceBasedRefinementResult,
            status: "SUCCESS",
        };

        await dbController.updateResumeGeneration(supabase, generationData, req.user.id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': evidenceBasedResume.length,
            'Content-Disposition': `attachment; filename="Resumes_${role || 'Optimized'}.pdf"`,
            'X-Token-Usage-Cost': result.tokenUsage?.cost?.toFixed(4) || '0',
            'X-Token-Input': result.tokenUsage?.input || '0',
            'X-Token-Output': result.tokenUsage?.output || '0'
        });

        res.send(evidenceBasedResume);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


export const generateResumePdf = async (req, res) => {
    const { newResumeContent, role } = req.body;
    const resumeData = newResumeContent || req.body;
    const evidenceBasedResume = await createPDF(resumeData);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': evidenceBasedResume.length,
        'Content-Disposition': `attachment; filename="Resumes_${role || 'Optimized'}.pdf"`,
    });

    res.send(evidenceBasedResume);
} 