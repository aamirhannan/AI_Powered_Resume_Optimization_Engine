# AI-Powered Resume Optimization Engine

## 🚀 The Idea
In today's competitive job market, a generic resume often gets lost in the pile. Adjusting a resume for every single job application is manual, tedious, and error-prone. 

The **AI-Powered Resume Optimization Engine** is built to solve this problem by treating resume optimization as a data engineering pipeline. It automates the process of tailoring a resume to a specific Job Description (JD) while preserving the candidate's authentic truth.

It doesn't just "rewrite" text; it **analyzes**, **critiques**, and **refines** the content using a multi-agent LLM approach, ensuring the final output is both highly relevant to the JD and strictly factual.

---

## 🏗️ Architectural Approach

The system is architected using a **Modular Pipeline Design Pattern**, decoupling the complex logic of resume transformation into discrete, manageable steps.

### 1. The Core Pipeline
Instead of a monolithic function, the application uses a linear pipeline executor (`Pipeline.js`) that runs a series of specialized steps. This ensures maintainability and scalability—new processing steps can be added without analyzing the entire codebase.

**Current Pipeline Stages:**
1.  **Context Loading**: Fetches the base resume (structured JSON) for the target role (e.g., Software Engineer, Backend, Frontend).
2.  **Rewrite (Phase 1)**: `RewriteResumeViaLLM` - Uses Chain-of-Thought (CoT) prompting to semantically align current experiences with the JD.
3.  **Critical Analysis (Phase 2)**: `CriticalAnalysis` - Simulates a "Senior Hiring Manager" persona to review the rewritten resume. It scores the resume and identifies gaps, producing a structured critique (JSON).
4.  **Evidence-Based Refinement (Phase 3)**: `EvidenceBasedRefinement` - Acts as a "Technical Editor". It takes the critique from Phase 2 and conditionally refines the resume. It only accepts changes that are supported by existing evidence, ensuring truthfulness.
5.  **Re-Integration**: `InsertNewlyCreatedResumePoints` - Merges the optimized data back into the main resume structure.

### 2. Multi-Agent LLM System
We utilize the OpenAI API not just for text generation, but for **reasoning**.
*   **Chain-of-Thought (CoT)**: Prompts are engineered to force the model to "think" before generating. It must analyze the JD, map themes, and plan the rewrite before outputting the final JSON.
*   **Adversarial Evaluation**: The *Critical Analysis* step acts as an adversary to the *Rewrite* step, providing quality control and preventing hallucinations.

### 3. High-Fidelity PDF Generation
*   **Template Engine**: Uses **EJS** to render semantic HTML5 templates.
*   **Layout Engine**: Uses **Puppeteer** (Headless Chrome) to generate PDFs. This ensures pixel-perfect rendering that looks exactly the same across all devices and OSs.
*   **CSS-in-JS Philosophy**: Styling is handled via standard CSS within the templates, ensuring high customization capability.

---

## 🏆 Key Achievements

*   **Modular Architecture**: Successfully decoupled processing logic, allowing distinct experimentation with Prompt Engineering without breaking the PDF generation or server logic.
*   **Recursive Self-Correction**: Implemented a feedback loop where the AI critiques its own work (Rewrite → Analyze → Refine), significantly improving alignment scores compared to a single-pass generation.
*   **100% Fact Preservation**: Strict prompting definitions ensure that while phrasing changes to match the JD, *metrics, dates, and company names* remain untouched.
*   **Automated Formatting**: Reduced the time to create a tailored, professional PDF resume from **30+ minutes** manually to **under 2 minutes**.
*   **Dual-Format Output**: The system returns both the **Optimized PDF** and an **Evidence-Based PDF** (showing the refined version based on strict critique), bundled in a ZIP file for easy comparison.

---

## 🛠️ Technology Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js (REST API)
*   **AI/LLM**: OpenAI API (GPT-4 / GPT-3.5-turbo models)
*   **Templating**: EJS (Embedded JavaScript)
*   **PDF Engine**: Puppeteer (Headless Chromium)
*   **Utilities**: Adm-Zip (Compression), Dotenv (Config)
*   **Development**: Nodemon (Hot Reloading)

---

## 📦 Usage

### Prerequisites
*   Node.js (v18+)
*   OpenAI API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/aamirhannan/resume-programe.git
    cd resume-programe
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    OPENAI_API_KEY=your_openai_api_key_here
    PORT=3000
    ```

### Running the Application

*   **Development Mode** (with Auto-restart):
    ```bash
    npm run dev
    ```

*   **Production Start**:
    ```bash
    npm start
    ```

### Generating a Resume

Send a **POST** request to `http://localhost:3000/api/generate-pdf` with the following JSON body:

```json
{
    "role": "softwareengineer",
    "jobDescription": "Paste the full job description here..."
}
```

The API will respond with a **ZIP file** containing your optimized resumes.
