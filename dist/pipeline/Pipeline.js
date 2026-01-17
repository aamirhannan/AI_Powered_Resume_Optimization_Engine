export class Pipeline {
    steps;
    constructor() {
        this.steps = [];
    }
    addStep(step) {
        this.steps.push(step);
        return this;
    }
    async execute(initialContext) {
        let context = { ...initialContext };
        console.log('--- Starting Pipeline ---');
        for (const step of this.steps) {
            console.log(`Executing step: ${step.name}`);
            try {
                context = await step.execute(context);
            }
            catch (error) {
                console.error(`Error in step ${step.name}:`, error);
                throw error;
            }
        }
        console.log('--- Pipeline Completed ---');
        return context;
    }
}
