# AI-Powered Resume & Application Engine

## 🚀 The Idea: Beyond Simple "Rewriting"
In today's competitive job market, tailoring your application for every single role is exhausting. Most tools are simple "LLM Wrappers" that blindly rewrite text, often hallucinating facts or creating generic fluff.

The **AI-Powered Resume Optimization Engine** is different. It treats the job application process as a **Data Engineering Pipeline**. It employs a **Multi-Agent Architecture** to not only optimize your resume but to handle the entire end-to-end application lifecycle—from analyzing the JD to sending the email.

It doesn't just "write"; it **plans, analyzes, critiques, refines, and delivers.**

---

## 🏗️ Architectural Approach

The system is architected using a **Modular Pipeline Design Pattern**, consciously avoiding the "Monolithic Function" anti-pattern common in simple AI apps.

### 1. The Modular Pipeline Pattern
Instead of a single, massive function trying to do everything, the application uses a linear pipeline executor (`Pipeline.js`). This decouples complex logic into discrete, testable steps.

*   **Why this matters**: It ensures maintainability and scalability. We can swap out the "PDF Generator" or add a "LinkedIn Analyzer" step without touching the core prompt logic.

### 2. The Execution Flow
The `process-application` pipeline runs a sophisticated sequence of specialized agents:

#### **Phase 1: The Optimization Loop (Resume Engineering)**
1.  **Context Loading**: Fetches the structured JSON resume for the target role (e.g., Frontend, Backend).
2.  **Semantic Rewrite (Chain-of-Thought)**: The *Writer Agent* analyzes the JD themes and rewrites experiences to align semantically, protecting the core facts.
3.  **Critical Analysis (Adversarial Step)**: The *Critic Agent* (Persona: Senior Hiring Manager) attempts to find flaws in the rewrite. It assigns a fit score and identifies missing keywords, producing a structured critique.
4.  **Evidence-Based Refinement**: The *Editor Agent* resolves the critique. It is strictly "Fact-Aware"—it only makes changes supported by existing evidence, preventing hallucinations.

#### **Phase 2: Contextual Generation**
5.  **Cover Letter Generation**: An agent reads the *optimized* resume and the JD to write a compelling, tailored cover letter.
6.  **Subject Line Optimization**: Generates high-conversion email subject lines to ensure the application gets opened.

#### **Phase 3: Delivery**
7.  **High-Fidelity PDF Generation**: Uses **Puppeteer** (Headless Chrome) and **EJS** to render pixel-perfect, ATS-friendly PDFs.
8.  **Automated Email Dispatch**: Uses **NodeMailer** (SMTP) to instantly email the Hiring Manager with the PDF attached.

### 3. Multi-Agent LLM System
We utilize the OpenAI API for **reasoning**, not just text generation.
*   **Chain-of-Thought (CoT)**: Prompts are engineered to force the model to "think" (analyzing gaps and requirements) before generating output.
*   **Recursive Self-Correction**: The feedback loop (Rewrite → Analyze → Refine) allows the system to fix its own mistakes, significantly outperforming single-pass generation.

---

## 🏆 Key Engineering Achievements

*   **100% Fact Preservation**: Strict constraint enforcement ensures that while phrasing changes to match the JD, *metrics, dates, and company names* remain untouched.
*   **Separation of Concerns**: Rendering (Puppeteer), Logic (Node.js), and Intelligence (LLM) are completely decoupled.
*   **Automated Formatting**: Reduced the time to create a tailored, professional application from **45+ minutes** manually to **under 2 minutes**.
*   **End-to-End Automation**: Solves the "Last Mile" problem by not just creating the file, but delivering it.

---

## 🛠️ Technology Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js (REST API)
*   **Architecture**: Pipeline Pattern, Multi-Agent System
*   **AI/LLM**: OpenAI API (GPT-4o / GPT-3.5)
*   **PDF Engine**: Puppeteer (Headless Chromium) -> *For pixel-perfect rendering*
*   **Email Engine**: Nodemailer (SMTP) -> *For delivery*
*   **Templating**: EJS

---

## 📦 Usage & Setup

### 1. Installation
```bash
git clone https://github.com/aamirhannan/resume-programe.git
cd resume-programe
npm install
```

### 2. Environment Setup
Create a `.env` file in the root. You need an OpenAI Key and Email Credentials.

> **Note**: If using Gmail, use an [App Password](https://myaccount.google.com/apppasswords), not your login password.

```env
PORT=3000
OPENAI_API_KEY=sk-...your-key...

# Email Request Configuration
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Run the Server
```bash
npm run dev
```

---

## ⚡ How to Auto-Apply

Send a **POST** request to the pipeline endpoint.

**Endpoint**: `POST http://localhost:3000/api/process-application`

**Body**:
```json
{
    "role": "frontend",
    "email": "hiring.manager@company.com",
    "jobDescription": "Full Job Description text here..."
}
```

### What happens in the background?
1.  **Analysis**: The engine breaks down the JD.
2.  **Optimization**: Your "frontend" resume is rewritten and refined.
3.  **Creation**: A PDF, Cover Letter, and Subject Line are generated.
4.  **Delivery**: The email is sent immediately.
5.  **Response**: You get a confirmation:
    ```json
    {
        "success": true,
        "details": {
            "subject": "Senior Frontend Engineer - Aamir Hannan - 4 YOE",
            "emailSentTo": "hiring.manager@company.com"
        }
    }
    ```
