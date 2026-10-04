/**
 * Error of the run, sent in the report at the end
 */
export default interface Failure {
    /** What failed */
    context: string
    /** Error */
    message: string
}
