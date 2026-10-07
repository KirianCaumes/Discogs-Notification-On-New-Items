import { Context, Data, Duration, Effect, Layer, Schedule } from 'effect'
import env from 'utils/env.util'
import type { FailuresNotification, ReleasesNotification } from 'interfaces/notification.interface'

/** Discord limits of a message: https://discord.com/developers/docs/resources/message#embed-object-embed-limits */
const LIMITS = {
    EMBEDS: 10,
    TITLE: 256,
    AUTHOR_NAME: 256,
    DESCRIPTION: 4096,
    FIELDS: 25,
    FIELD_NAME: 256,
    FIELD_VALUE: 1024,
    FOOTER: 2048,
    TOTAL: 6000,
}
const TIMEOUT_MS = 30_000
/** Color of the left border of an embed, by role */
const COLORS: Record<string, number> = { Main: 0x2ecc71, Appearance: 0x3498db, Unofficial: 0xe67e22, Credit: 0x9b59b6, Error: 0xe74c3c }

interface Embed {
    /** Title */
    title: string
    /** Url of the title */
    url?: string
    /** Description */
    description?: string
    /** Author, displayed above the title */
    author?: {
        /** Name */
        name: string
        /** Url of the name */
        url?: string
    }
    /** Color of the left border */
    color?: number
    /** Fields, displayed as a grid when inline */
    fields?: Array<{
        /** Name */
        name: string
        /** Value */
        value: string
        /** Displayed next to the other inline fields */
        inline?: boolean
    }>
    /** Thumbnail */
    thumbnail?: {
        /** Url */
        url: string
    }
    /** Footer */
    footer?: {
        /** Text */
        text: string
    }
    /** ISO date, displayed in the footer */
    timestamp?: string
}

/**
 * Error while sending a Discord message
 */
export class DiscordError extends Data.TaggedError('DiscordError')<{
    /** Message */
    message: string
    /** Network error, rate limit or server error: worth retrying */
    isRetryable: boolean
    /** Some messages were sent, but not all of them */
    isPartial?: boolean
}> {}

/**
 * Post a message on the Discord webhook
 * @param body Body
 * @returns Nothing
 */
const post = (body: object) =>
    Effect.gen(function* () {
        const res = yield* Effect.tryPromise({
            try: async () => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const url = new URL(env.DISCORD_WEBHOOK_URL!)
                url.searchParams.set('wait', 'true')
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(TIMEOUT_MS),
                })
                return {
                    status: response.status,
                    ok: response.ok,
                    text: await response.text(),
                    /** Seconds to wait when rate limited */
                    retryAfter: Number(response.headers.get('retry-after')) || 0,
                }
            },
            catch: cause => new DiscordError({ message: String(cause), isRetryable: true }),
        })
        if (res.status === 429) {
            // Wait the time asked by Discord before retrying
            yield* Effect.sleep(Duration.seconds(res.retryAfter))
        }
        if (!res.ok) {
            return yield* Effect.fail(
                new DiscordError({
                    message: `${res.status} ${res.text}`,
                    isRetryable: res.status === 429 || res.status >= 500,
                }),
            )
        }
    }).pipe(
        Effect.tapError(error => Effect.logWarning(`Discord: ${error.message}`)),
        // A client error (invalid webhook, invalid body…) will not succeed by retrying
        Effect.retry({ times: 3, schedule: Schedule.exponential('2 seconds'), while: error => error.isRetryable }),
    )

/**
 * Characters counted by Discord for an embed
 * @param embed Embed
 * @returns Characters
 */
const getSize = (embed: Embed) =>
    embed.title.length +
    (embed.author?.name.length ?? 0) +
    (embed.description?.length ?? 0) +
    (embed.footer?.text.length ?? 0) +
    (embed.fields ?? []).reduce((total, field) => total + field.name.length + field.value.length, 0)

/**
 * Cut an embed to the Discord limits
 * @param embed Embed
 * @returns Embed
 */
const truncate = (embed: Embed): Embed => ({
    ...embed,
    title: embed.title.slice(0, LIMITS.TITLE),
    description: embed.description?.slice(0, LIMITS.DESCRIPTION),
    author: embed.author && { ...embed.author, name: embed.author.name.slice(0, LIMITS.AUTHOR_NAME) },
    fields: embed.fields
        ?.slice(0, LIMITS.FIELDS)
        .map(field => ({ ...field, name: field.name.slice(0, LIMITS.FIELD_NAME), value: field.value.slice(0, LIMITS.FIELD_VALUE) })),
    footer: embed.footer && { text: embed.footer.text.slice(0, LIMITS.FOOTER) },
})

/**
 * Split embeds in messages, respecting the Discord limits of embeds and characters per message
 * @param embeds Embeds
 * @returns Embeds by message
 */
const chunkEmbeds = (embeds: Array<Embed>) =>
    embeds.map(truncate).reduce<Array<Array<Embed>>>((chunks, embed) => {
        const last = chunks.at(-1)
        if (last && last.length < LIMITS.EMBEDS && last.reduce((total, e) => total + getSize(e), 0) + getSize(embed) <= LIMITS.TOTAL) {
            last.push(embed)
        } else {
            chunks.push([embed])
        }
        return chunks
    }, [])

/**
 * Send a message on Discord, split in several messages if there are too many embeds.
 * Every message is tried, so one failing does not prevent the others to be sent.
 * @param options Options
 * @param options.content Text of the first message
 * @param options.embeds Embeds
 * @returns Nothing, fails if a message failed
 */
const sendDiscord = ({
    content,
    embeds,
}: {
    /** Text of the first message */
    content: string
    /** Embeds */
    embeds: Array<Embed>
}) =>
    Effect.gen(function* () {
        const chunks = chunkEmbeds(embeds)
        const results = yield* Effect.forEach(chunks, (chunk, i) =>
            post(i === 0 ? { content, embeds: chunk } : { embeds: chunk }).pipe(
                Effect.as(undefined),
                Effect.catchTag('DiscordError', error => Effect.succeed(error)),
            ),
        )
        const errors = results.filter(error => error !== undefined)
        if (errors.length > 0) {
            return yield* Effect.fail(
                new DiscordError({
                    message: `${errors.length} of ${chunks.length} message(s) not sent: ${errors.map(error => error.message).join(', ')}`,
                    isRetryable: false,
                    isPartial: errors.length < chunks.length,
                }),
            )
        }
    })

/**
 * Notifications on Discord
 */
export class Discord extends Context.Service<
    Discord,
    {
        /** Send the new releases of an artist, one embed by release */
        readonly sendReleases: (notification: ReleasesNotification) => Effect.Effect<void, DiscordError>
        /** Send the errors of the run, one embed by error */
        readonly sendFailures: (notification: FailuresNotification) => Effect.Effect<void, DiscordError>
    }
>()('Discord') {}

/**
 * Messages sent on the webhook of the environment
 */
export const DiscordLive = Layer.succeed(Discord, {
    // Built only when sent
    sendReleases: ({ title, artistId, name, releases, date }) =>
        Effect.suspend(() =>
            sendDiscord({
                content: title,
                embeds: releases.map(release => ({
                    title: `${release.artist} - ${release.title}`,
                    url: `https://www.discogs.com/release/${release.id}`,
                    author: { name, url: `https://www.discogs.com/artist/${artistId}` },
                    color: COLORS[release.role],
                    fields: [
                        { name: '💽 Format', value: release.format ?? '-' },
                        { name: '🏷️ Label', value: release.label ?? '-' },
                        { name: '🆕 Release', value: release.date ?? '-' },
                        {
                            name: '📅 Listed',
                            value: release.dateAdded ? `<t:${Math.floor(new Date(release.dateAdded).getTime() / 1000)}:D>` : '-',
                        },
                        { name: '🎭 Role', value: release.role },
                    ],
                    thumbnail: release.thumb ? { url: release.thumb } : undefined,
                    footer: { text: `${name} • Discogs Notification` },
                    timestamp: date.toISOString(),
                })),
            }),
        ),
    sendFailures: ({ title, failures, date }) =>
        Effect.suspend(() =>
            sendDiscord({
                content: `❌ ${title}`,
                embeds: failures.map(({ context, message }) => ({
                    title: `⚠️ ${context}`,
                    description: `\`\`\`${message.slice(0, 4000)}\`\`\``,
                    color: COLORS.Error,
                    footer: { text: 'Discogs Notification' },
                    timestamp: date.toISOString(),
                })),
            }),
        ),
})
