import { Cause, Context, Data, Effect, Layer, Ref } from 'effect'
import env from 'utils/env.util'
import { Mail } from 'utils/send-mail.util'
import { Discord, DiscordError } from 'utils/send-discord.util'
import type Failure from 'interfaces/failure.interface'
import type { FailuresNotification, ReleasesNotification } from 'interfaces/notification.interface'
import type { Release } from 'utils/discogs.util'

/** Date at the start of the run */
const dt = new Date()

/**
 * Every notification channel failed
 */
export class NotificationError extends Data.TaggedError('NotificationError')<{
    /** Message */
    message: string
}> {}

/**
 * Errors of the run, sent at the end
 */
export class Failures extends Context.Service<
    Failures,
    {
        /** Log an error and keep it */
        readonly record: (context: string, cause: Cause.Cause<unknown>) => Effect.Effect<void>
        /** Every error kept */
        readonly getAll: Effect.Effect<Array<Failure>>
    }
>()('Failures') {}

/**
 * Errors kept in memory for the run
 */
export const FailuresLive = Layer.effect(
    Failures,
    Effect.gen(function* () {
        const failures = yield* Ref.make<Array<Failure>>([])
        return {
            record: (context, cause) =>
                Effect.logError(context, cause).pipe(
                    Effect.andThen(Ref.update(failures, all => [...all, { context, message: String(Cause.squash(cause)) }])),
                ),
            getAll: Ref.get(failures),
        }
    }),
)

/**
 * Log an error and keep it to send it at the end of the run
 * @param context What failed
 * @param cause Cause
 * @returns Nothing
 */
export const recordFailure = (context: string, cause: Cause.Cause<unknown>) => Failures.use(failures => failures.record(context, cause))

/**
 * Send on every configured channel, each one independently
 * @param context What is sent, for the logs
 * @param send Send with the service of each channel
 * @param send.mail By mail
 * @param send.discord On Discord
 * @returns Number of channels that succeeded
 */
const sendOnChannels = (
    context: string,
    send: {
        /** By mail */
        mail: (mail: Mail['Service']) => Effect.Effect<void, unknown>
        /** On Discord */
        discord: (discord: Discord['Service']) => Effect.Effect<void, unknown>
    },
) => {
    const channels: Array<{
        /** Name */
        name: string
        /** Sending */
        send: Effect.Effect<void, unknown, Mail | Discord>
    }> = [
        ...(env.MAIL_HOST ? [{ name: 'Mail', send: Mail.use(send.mail) }] : []),
        ...(env.DISCORD_WEBHOOK_URL ? [{ name: 'Discord', send: Discord.use(send.discord) }] : []),
    ]

    return Effect.forEach(channels, ({ name, send: sendOnChannel }) =>
        sendOnChannel.pipe(
            Effect.andThen(Effect.log(`${name} sent: ${context}`)),
            Effect.as(true),
            Effect.catchCause(cause => {
                // Some Discord messages were sent: count it as delivered, so they are not sent again on the next run
                const error = Cause.squash(cause)
                return recordFailure(`${name}: ${context}`, cause).pipe(
                    Effect.as(error instanceof DiscordError && error.isPartial === true),
                )
            }),
        ),
    ).pipe(Effect.map(results => results.filter(Boolean).length))
}

/**
 * Send the new releases of an artist on every configured channel
 * @param options Options
 * @param options.artistId Artist id
 * @param options.name Artist name
 * @param options.releases New releases
 * @returns Nothing, fails only if every channel failed
 */
export const notifyReleases = (options: {
    /** Artist id */
    artistId: string
    /** Artist name */
    name: string
    /** New releases */
    releases: Array<Release>
}) =>
    Effect.gen(function* () {
        const { length } = options.releases
        const notification: ReleasesNotification = {
            ...options,
            title: `${options.name} - ${length.toLocaleString(env.LOCALE)} New Release${length > 1 ? 's' : ''}`,
            date: dt,
        }

        // Channels are independent: one failing must not send the other again on the next run
        const succeeded = yield* sendOnChannels(notification.title, {
            mail: mail => mail.sendReleases(notification),
            discord: discord => discord.sendReleases(notification),
        })

        if (succeeded === 0) {
            return yield* Effect.fail(new NotificationError({ message: 'Every notification channel failed' }))
        }
    })

/**
 * Send the errors of the run on every configured channel
 * @returns Number of errors of the run, the ones of the report included
 */
export const reportFailures = Effect.gen(function* () {
    const failures = yield* Failures
    const all = yield* failures.getAll
    if (all.length > 0) {
        const notification: FailuresNotification = {
            title: `Discogs Notification - ${all.length} Error${all.length > 1 ? 's' : ''}`,
            failures: all,
            date: dt,
        }
        yield* sendOnChannels(notification.title, {
            mail: mail => mail.sendFailures(notification),
            discord: discord => discord.sendFailures(notification),
        })
    }
    return (yield* failures.getAll).length
})
