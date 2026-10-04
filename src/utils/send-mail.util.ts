import { readFileSync } from 'fs'
import { Context, Data, Effect, Layer, Schedule } from 'effect'
import Handlebars from 'handlebars'
import nodemailer from 'nodemailer'
import env from 'utils/env.util'
import type { FailuresNotification, ReleasesNotification } from 'interfaces/notification.interface'
import type { Transporter } from 'nodemailer'

const releasesTemplate = Handlebars.compile(readFileSync('./src/templates/mail.template.hbs').toString())
const failuresTemplate = Handlebars.compile(readFileSync('./src/templates/error.template.hbs').toString())

/**
 * Error while sending a mail
 */
export class MailError extends Data.TaggedError('MailError')<{
    /** Message */
    message: string
    /** Network error or temporary SMTP error (4xx): worth retrying */
    isRetryable: boolean
}> {}

/**
 * Notifications by mail
 */
export class Mail extends Context.Service<
    Mail,
    {
        /** Send the new releases of an artist */
        readonly sendReleases: (notification: ReleasesNotification) => Effect.Effect<void, MailError>
        /** Send the errors of the run */
        readonly sendFailures: (notification: FailuresNotification) => Effect.Effect<void, MailError>
    }
>()('Mail') {}

/**
 * Send an email
 * @param transporter Transporter
 * @param options Options
 * @param options.subject Subject
 * @param options.html Html
 * @returns Nothing
 */
const sendMail = (
    transporter: Transporter,
    options: {
        /** Subject */
        subject: string
        /** Html */
        html: string
    },
) =>
    Effect.tryPromise({
        try: () =>
            transporter.sendMail({
                from: {
                    address: env.MAIL_FROM,
                    name: 'Discogs Release Bot',
                },
                to: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    address: env.MAIL_TO!,
                    name: '',
                },
                subject: options.subject,
                html: options.html,
            }),
        catch: cause => {
            const { responseCode } = cause as {
                /** SMTP response code, undefined on network errors */
                responseCode?: number
            }
            return new MailError({ message: String(cause), isRetryable: responseCode === undefined || responseCode < 500 })
        },
    }).pipe(
        Effect.tapError(error => Effect.logWarning(`Mail: ${error.message}`)),
        // A permanent SMTP error (5xx: authentication failed, invalid recipient…) will not succeed by retrying
        Effect.retry({ times: 3, schedule: Schedule.exponential('2 seconds'), while: error => error.isRetryable }),
        Effect.asVoid,
    )

/**
 * Format a date with the locale
 * @param date Date
 * @returns "10/04/2026, 13:02"…
 */
const formatDate = (date: Date) =>
    date.toLocaleDateString(env.LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

/**
 * Mails sent with the SMTP server of the environment, closed at the end of the run
 */
export const MailLive = Layer.effect(
    Mail,
    Effect.gen(function* () {
        const transporter = yield* Effect.acquireRelease(
            Effect.sync(() =>
                nodemailer.createTransport({
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    host: env.MAIL_HOST!,
                    port: env.MAIL_PORT,
                    secure: env.MAIL_PORT === 465,
                    auth: {
                        user: env.MAIL_USER,
                        pass: env.MAIL_PASS,
                    },
                }),
            ),
            t =>
                Effect.sync(() => {
                    t.close()
                }),
        )

        return {
            // Rendered only when sent
            sendReleases: ({ title, artistId, name, releases, date }) =>
                Effect.suspend(() =>
                    sendMail(transporter, {
                        subject: title,
                        html: releasesTemplate({
                            itemsLength: releases.length.toLocaleString(env.LOCALE),
                            isPlural: releases.length > 1,
                            artist: { id: artistId, name },
                            date: formatDate(date),
                            items: releases,
                            previewVoids: new Array(50).fill('&#847; &zwnj; &nbsp; &#8199; &shy;'),
                        }),
                    }),
                ),
            sendFailures: ({ title, failures, date }) =>
                Effect.suspend(() =>
                    sendMail(transporter, {
                        subject: title,
                        html: failuresTemplate({
                            failuresLength: failures.length,
                            isPlural: failures.length > 1,
                            date: formatDate(date),
                            failures,
                        }),
                    }),
                ),
        }
    }),
)
