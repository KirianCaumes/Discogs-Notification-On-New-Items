import { rmSync } from 'fs'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { before, describe, it } from 'node:test'
import { Effect, Layer, References } from 'effect'
import { checkArtists } from 'index'
import { ItemsLive } from 'utils/db.util'
import env from 'utils/env.util'
import { Discogs, DiscogsError } from 'utils/discogs.util'
import { Discord, DiscordError } from 'utils/send-discord.util'
import { Mail, MailError } from 'utils/send-mail.util'
import { FailuresLive, reportFailures } from 'utils/notify.util'
import type { Release } from 'utils/discogs.util'

/**
 * Release of the tests
 * @param id Id
 * @param overrides Values to change
 * @returns Release
 */
const makeRelease = (id: number, overrides: Partial<Release> = {}): Release => ({
    id,
    title: `Title ${id}`,
    artist: 'Artist',
    role: 'Main',
    isDetailed: true,
    isCredited: true,
    ...overrides,
})

/**
 * Run the program the way `index.ts` does, with fake services, and keep what is sent
 * @param options Options
 * @param options.releases Discography of every artist
 * @param options.artistIds Artist ids
 * @param options.isSilent Silent mode
 * @param options.isMailFailing The mail of the releases fails
 * @param options.isDiscordFailing The Discord message of the releases fails
 * @param options.isDiscordPartial The Discord message of the releases is only partly sent
 * @param options.failingArtistId Artist whose discography can not be fetched
 * @returns What was sent, and the number of errors of the run
 */
const run = async ({
    releases,
    artistIds,
    isSilent = false,
    isMailFailing = false,
    isDiscordFailing = false,
    isDiscordPartial = false,
    failingArtistId,
}: {
    /** Discography of every artist */
    releases: Array<Release>
    /** Artist ids, different in each test as they share the database */
    artistIds: Array<string>
    /** Silent mode */
    isSilent?: boolean
    /** The mail of the releases fails */
    isMailFailing?: boolean
    /** The Discord message of the releases fails */
    isDiscordFailing?: boolean
    /** The Discord message of the releases is only partly sent */
    isDiscordPartial?: boolean
    /** Artist whose discography can not be fetched */
    failingArtistId?: string
}) => {
    const sent = { mail: [] as Array<Array<number>>, discord: [] as Array<Array<number>>, failures: [] as Array<Array<string>> }

    const discogs = Layer.succeed(Discogs, {
        getDiscography: artistId =>
            artistId === failingArtistId
                ? Effect.fail(new DiscogsError({ message: `Artist ${artistId} not found`, isRetryable: false }))
                : Effect.succeed({ name: 'Artist', releases }),
        getReleaseDetails: release => Effect.succeed(release),
    })
    const mail = Layer.succeed(Mail, {
        sendReleases: notification =>
            isMailFailing
                ? Effect.fail(new MailError({ message: 'SMTP down', isRetryable: false }))
                : Effect.sync(() => {
                      sent.mail.push(notification.releases.map(release => release.id))
                  }),
        sendFailures: notification =>
            Effect.sync(() => {
                sent.failures.push(notification.failures.map(failure => failure.context))
            }),
    })
    const discord = Layer.succeed(Discord, {
        sendReleases: notification => {
            if (isDiscordFailing || isDiscordPartial) {
                return Effect.fail(new DiscordError({ message: 'Webhook down', isRetryable: false, isPartial: isDiscordPartial }))
            }
            return Effect.sync(() => {
                sent.discord.push(notification.releases.map(release => release.id))
            })
        },
        sendFailures: () => Effect.void,
    })

    const failuresCount = await Effect.runPromise(
        checkArtists(artistIds, { isSilent }).pipe(
            Effect.provide(Layer.mergeAll(discogs, ItemsLive)),
            Effect.andThen(reportFailures),
            Effect.provide(Layer.mergeAll(mail, discord, FailuresLive)),
            Effect.provideService(References.MinimumLogLevel, 'None'),
        ),
    )

    return { ...sent, failuresCount }
}

describe('checkArtists', () => {
    // Database of `test/test.env`, emptied before the tests
    before(() => {
        rmSync(env.DB_PATH, { force: true })
    })

    it('saves the discography without notifying on the first run', async () => {
        const artistIds = ['1']

        const first = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)] })
        deepStrictEqual([first.mail, first.discord, first.failuresCount], [[], [], 0])

        // Already saved: nothing new on the next run
        const second = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)] })
        deepStrictEqual([second.mail, second.discord], [[], []])
    })

    it('notifies the new releases on every channel, sorted, then saves them', async () => {
        const artistIds = ['2']
        await run({ artistIds, releases: [makeRelease(1)] })

        const releases = [makeRelease(1), makeRelease(3, { title: 'B' }), makeRelease(2, { title: 'A' })]
        const second = await run({ artistIds, releases })
        deepStrictEqual(second.mail, [[2, 3]])
        deepStrictEqual(second.discord, [[2, 3]])

        const third = await run({ artistIds, releases })
        deepStrictEqual([third.mail, third.discord], [[], []])
    })

    it('ignores the versions not crediting the artist, but saves them', async () => {
        const artistIds = ['3']
        await run({ artistIds, releases: [makeRelease(1)] })

        const releases = [makeRelease(1), makeRelease(2), makeRelease(3, { isCredited: false })]
        const second = await run({ artistIds, releases })
        deepStrictEqual(second.mail, [[2]])

        const third = await run({ artistIds, releases })
        deepStrictEqual(third.mail, [])
    })

    it('saves without notifying in silent mode', async () => {
        const artistIds = ['4']
        await run({ artistIds, releases: [makeRelease(1)] })

        const second = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)], isSilent: true })
        deepStrictEqual([second.mail, second.discord], [[], []])

        const third = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)] })
        deepStrictEqual(third.mail, [])
    })

    it('saves the releases when a channel fails, and reports the error', async () => {
        const artistIds = ['5']
        await run({ artistIds, releases: [makeRelease(1)] })

        const second = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)], isMailFailing: true })
        deepStrictEqual(second.discord, [[2]])
        deepStrictEqual(second.failures, [['Mail: Artist - 1 New Release']])
        strictEqual(second.failuresCount, 1)

        // Not sent again on Discord
        const third = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)] })
        deepStrictEqual(third.discord, [])
    })

    it('does not save the releases when every channel fails, so they are sent on the next run', async () => {
        const artistIds = ['6']
        await run({ artistIds, releases: [makeRelease(1)] })

        const second = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)], isMailFailing: true, isDiscordFailing: true })
        // Each channel reported once, without the error of the artist on top
        deepStrictEqual(second.failures, [['Mail: Artist - 1 New Release', 'Discord: Artist - 1 New Release']])

        const third = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)] })
        deepStrictEqual(third.mail, [[2]])
        deepStrictEqual(third.discord, [[2]])
    })

    it('counts a Discord message partly sent as delivered', async () => {
        const artistIds = ['7']
        await run({ artistIds, releases: [makeRelease(1)] })

        const second = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)], isMailFailing: true, isDiscordPartial: true })
        strictEqual(second.failuresCount, 2)

        // Saved: the messages already sent on Discord are not sent again
        const third = await run({ artistIds, releases: [makeRelease(1), makeRelease(2)] })
        deepStrictEqual([third.mail, third.discord], [[], []])
    })

    it('checks the other artists when one fails', async () => {
        const first = await run({ releases: [makeRelease(1)], artistIds: ['8', '9'], failingArtistId: '8' })
        deepStrictEqual(first.failures, [['Artist 8']])

        // Artist 9 was saved on the first run, so its new release is notified
        const second = await run({ releases: [makeRelease(1), makeRelease(2)], artistIds: ['9'] })
        deepStrictEqual(second.mail, [[2]])
    })
})
