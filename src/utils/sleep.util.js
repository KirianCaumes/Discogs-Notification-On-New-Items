/**
 * Sleep
 * @param {number} ms Ms to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms = 500) =>
    new Promise(resolve => {
        setTimeout(resolve, ms)
    })

export default sleep
