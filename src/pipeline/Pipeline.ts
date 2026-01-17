import { Step } from '#pipeline/Step';

export class Pipeline<T = any> {
    steps: Step<T>[];

    constructor() {
        this.steps = [];
    }

    addStep(step: Step<T>): this {
        this.steps.push(step);
        return this;
    }

    async execute(initialContext: T): Promise<T> {
        let context = { ...initialContext };

        console.log('--- Starting Pipeline ---');
        for (const step of this.steps) {
            console.log(`Executing step: ${step.name}`);
            try {
                context = await step.execute(context);
            } catch (error) {
                console.error(`Error in step ${step.name}:`, error);
                throw error;
            }
        }
        console.log('--- Pipeline Completed ---');

        return context;
    }
}
