/**
 * Base class for all pipeline steps.
 * Implements the command pattern for the pipeline.
 */
export class Step {
    name;
    constructor(name) {
        this.name = name;
    }
}
