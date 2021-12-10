/**
 * Log content
 * @param {any} content content
 * @param {boolean=} replace replace
 */
export default function log(content, replace = false) {
    if (replace) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(content)
    } else {
        process.stdout.write(`${content || ''}\n`)
    }
}
