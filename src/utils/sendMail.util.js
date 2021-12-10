import nodemailer from 'nodemailer'
import sendgridTransport from 'nodemailer-sendgrid-transport'
import Handlebars from 'handlebars'
import fs from 'fs'
import env from './env.util'

/**
 * Send an email
 * @param {{
 *  id: number;
 *  type: "release" | "master";
 *  artist: string;
 *  label: string;
 *  title: string;
 *  format: string;
 *  date: string;
 *  thumb: string;
 *  role: string;
 * }[]} releasesToSend ReleasesToSend
 * @returns {Promise<import('nodemailer').SentMessageInfo>} Message info
 */
export default function sendMail(releasesToSend) {
    return nodemailer
        .createTransport(sendgridTransport({
            auth: {
                api_key: env.SENDGRID_API_KEY,
            },
        }))
        .sendMail({
            from: `"Discogs Bot" <${env.MAIL_FROM}>`,
            to: env.MAIL_TO,
            replyTo: env.MAIL_REPLY,
            subject: `New release(s) - ${new Date().toLocaleString('FR-fr', { year: 'numeric', month: '2-digit', day: '2-digit' })}`,
            html: Handlebars.compile(fs.readFileSync('./src/templates/mail.template.html').toString())({
                items: releasesToSend.sort((a, b) => a.artist?.localeCompare(b.artist) || a.title?.localeCompare(b.title)),
            }),
        })
}
