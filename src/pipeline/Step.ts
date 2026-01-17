
/**
 * Base class for all pipeline steps.
 * Implements the command pattern for the pipeline.
 */
export abstract class Step<T = any> {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Executes the step logic.
     * @param context - The shared context object passed through the pipeline.
     * @returns The updated context.
     */
    abstract execute(context: T): Promise<T>;
}
