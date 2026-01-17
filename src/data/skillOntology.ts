export interface SkillData {
    aliases: string[];
    category: string;
}

export const SKILL_ONTOLOGY: Record<string, SkillData> = {
    // Frontend
    'react': { aliases: ['react.js', 'reactjs', 'react js', 'frontend library'], category: 'frontend' },
    'next.js': { aliases: ['nextjs', 'next js', 'next'], category: 'frontend' },
    'typescript': { aliases: ['ts', 'type script'], category: 'frontend' },
    'javascript': { aliases: ['js', 'es6', 'es6+', 'ecmascript'], category: 'frontend' },
    'html': { aliases: ['html5', 'markup'], category: 'frontend' },
    'css': { aliases: ['css3', 'styles', 'stylesheets'], category: 'frontend' },
    'redux': { aliases: ['redux toolkit', 'rtk', 'state management'], category: 'frontend' },
    'tailwind': { aliases: ['tailwind css', 'tailwindcss', 'utility-first css'], category: 'frontend' },
    'material ui': { aliases: ['mui', 'material-ui'], category: 'frontend' },

    // Backend
    'node.js': { aliases: ['node', 'nodejs', 'server-side javascript'], category: 'backend' },
    'express': { aliases: ['express.js', 'expressjs'], category: 'backend' },
    'python': { aliases: ['py', 'python3'], category: 'backend' },
    'java': { aliases: [], category: 'backend' },
    'golang': { aliases: ['go'], category: 'backend' },

    // Database
    'mongodb': { aliases: ['mongo', 'nosql'], category: 'database' },
    'postgresql': { aliases: ['postgres', 'pgsql'], category: 'database' },
    'redis': { aliases: [], category: 'database' },

    // DevOps/Tools
    'docker': { aliases: ['containerization', 'containers'], category: 'devops' },
    'kubernetes': { aliases: ['k8s'], category: 'devops' },
    'aws': { aliases: ['amazon web services', 'cloud'], category: 'devops' },
    'git': { aliases: ['version control', 'github', 'gitlab'], category: 'tools' },
    'jest': { aliases: ['testing library', 'unit testing'], category: 'testing' }
};

export const SENIORITY_LEVELS = ['junior', 'entry level', 'mid', 'senior', 'lead', 'principal', 'staff', 'architect', 'manager', 'head'];
