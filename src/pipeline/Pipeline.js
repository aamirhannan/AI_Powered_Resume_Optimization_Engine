import { logStep } from '../services/apiRequestLogger.js';

export class Pipeline {
    constructor() {
        this.steps = [];
    }

    addStep(step) {
        this.steps.push(step);
        return this;
    }

    async execute(initialContext, loggerContext = {}) {
        let context = { ...initialContext };
        const { supabase, logId } = loggerContext;

        console.log('--- Starting Pipeline ---');
        for (const step of this.steps) {
            console.log(`Executing step: ${step.name}`);
            const stepName = step.constructor.name;

            // Log Step Start
            if (supabase && logId) {
                await logStep(supabase, logId, stepName, 'START');
            }

            try {
                const startTime = Date.now();
                context = await step.execute(context);
                const duration = Date.now() - startTime;

                // Log Step Success
                if (supabase && logId) {
                    await logStep(supabase, logId, stepName, 'SUCCESS', {
                        duration_ms: duration,
                        token_usage: context.tokenUsage
                    });
                }
            } catch (error) {
                console.error(`Error in step ${step.name}:`, error);

                // Log Step Failure
                if (supabase && logId) {
                    await logStep(supabase, logId, stepName, 'FAILED', {
                        error: error.message
                    });
                }
                throw error;
            }
        }
        console.log('--- Pipeline Completed ---');

        return context;
    }
}
