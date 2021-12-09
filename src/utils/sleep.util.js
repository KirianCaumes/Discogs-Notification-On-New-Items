/**
 * Sleep
 * @param {number} ms Ms to sleep
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-promise-executor-return
const sleep = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

export default sleep
