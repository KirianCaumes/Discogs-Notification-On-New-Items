import env from 'utils/env.util'
import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

const transporter = nodemailer.createTransport({
    host: env.MAIL_HOST!,
    port: env.MAIL_PORT!,
    secure: env.MAIL_PORT === 465,
    auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS,
    },
})

/**
 * Send an email
 */
export default function sendMail(options: {
    /** Subject */
    subject: string
    /** Html */
    html: string
}): Promise<SMTPTransport.SentMessageInfo> {
    return transporter.sendMail({
        from: {
            address: env.MAIL_FROM,
            name: 'Discogs Neat Bot',
        },
        to: {
            address: env.MAIL_TO!,
            name: '',
        },
        subject: options.subject,
        html: options.html,
    })
}
