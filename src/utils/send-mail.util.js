import sendgrid from '@sendgrid/mail'
import env from './env.util.js'

sendgrid.setApiKey(env.SENDGRID_API_KEY)

/**
 * Send an email
 * @param {object} options Options
 * @param {string} options.subject Subject
 * @param {string} options.html Html
 * @returns {ReturnType<import('@sendgrid/mail').MailService['send']>} Message info
 */
export default function sendMail(options) {
    return sendgrid.send({
        to: {
            email: env.MAIL_TO,
        },
        from: {
            email: env.MAIL_FROM,
            name: 'Discogs Bot',
        },
        subject: options.subject,
        html: options.html,
    })
}
