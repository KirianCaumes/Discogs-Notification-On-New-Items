import nodemailer from 'nodemailer'
import nodemailerSendgrid from 'nodemailer-sendgrid'
import env from './env.util'

/**
 * Send an email
 * @param {import('nodemailer/lib/mailer').Options} mailOptions mailOptions
 * @returns {Promise<import('nodemailer').SentMessageInfo>} Message info
 */
export default function sendMail(mailOptions) {
    return nodemailer
        .createTransport(
            nodemailerSendgrid({
                apiKey: env.SENDGRID_API_KEY,
            }),
        )
        .sendMail({
            from: `"Discogs Bot" < ${env.MAIL_FROM}> `,
            to: env.MAIL_TO,
            ...mailOptions,
        })
}
