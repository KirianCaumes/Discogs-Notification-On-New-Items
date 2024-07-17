import sendgrid from '@sendgrid/mail'
import env from 'utils/env.util'
import type { MailService } from '@sendgrid/mail'

sendgrid.setApiKey(env.SENDGRID_API_KEY!)

/**
 * Send an email
 */
export default function sendMail(options: {
    /** Subject */
    subject: string
    /** Html */
    html: string
}): ReturnType<MailService['send']> {
    return sendgrid.send({
        to: {
            email: env.MAIL_TO!,
        },
        from: {
            email: env.MAIL_FROM,
            name: 'Discogs Release Bot',
        },
        subject: options.subject,
        html: options.html,
    })
}
