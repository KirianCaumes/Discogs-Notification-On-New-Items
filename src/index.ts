import { Effect, Layer } from 'effect'
import env from 'utils/env.util'
import { Discogs, DiscogsLive } from 'utils/discogs.util'
import { Items, ItemsLive } from 'utils/db.util'
import { MailLive } from 'utils/send-mail.util'
import { DiscordLive } from 'utils/send-discord.util'
import { FailuresLive, notifyReleases, recordFailure, reportFailures } from 'utils/notify.util'

/**
 * Notify the new releases of an artist, then save them
 * @param artistId Artist id
 * @param isSilent Save the releases without notifying
 * @returns Nothing
 */
const checkArtist = (artistId: string, isSilent: boolean) =>
    Effect.gen(function* () {
        const discogs = yield* Discogs
        const items = yield* Items

        yield* Effect.log(`Artist: ${artistId}`)

        const { name, releases } = yield* discogs.getDiscography(artistId)

        const idsDb = yield* items.getIds(artistId)

        /** New releases */
        const releasesToSend = releases.filter(release => !idsDb.has(release.id))

        yield* Effect.log(`${name}: ${releasesToSend.length} new release(s), ${releases.length} in total (before: ${idsDb.size})`)

        if (releasesToSend.length > 0 && isSilent) {
            yield* Effect.log('Silent mode: saved without notifying')
        } else if (releasesToSend.length > 0 && idsDb.size === 0) {
            // Do not notify on the first run of an artist, it would send its whole discography
            yield* Effect.log('First run: saved without notifying')
        } else if (releasesToSend.length > 0) {
            /** New releases with their own details */
            const detailed = yield* Effect.forEach(releasesToSend, release => discogs.getReleaseDetails(release, artistId))

            const ignored = detailed.filter(release => !release.isCredited)
            if (ignored.length > 0) {
                const titles = ignored.map(release => `${release.artist} - ${release.title} (${release.id})`).join(', ')
                yield* Effect.log(`${ignored.length} ignored, ${name} not credited on these versions: ${titles}`)
            }

            /** New releases to notify, sorted */
            const toNotify = detailed
                .filter(release => release.isCredited)
                .sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title) || a.id - b.id)

            if (toNotify.length > 0) {
                yield* Effect.log(`${toNotify.length} release(s) to notify`)
                yield* notifyReleases({ artistId, name, releases: toNotify })
            }
        }

        // Saved only once notified, so a notification failing on every channel is sent again on the next run
        yield* items.upsertMany(
            artistId,
            releases.map(release => ({ id: release.id, title: `${release.artist} - ${release.title}` })),
        )
    })

/**
 * Check every artist: an artist failing does not prevent checking the others
 * @param artistIds Artist ids
 * @param options Options
 * @param options.isSilent Save the releases without notifying
 * @returns Nothing
 */
export const checkArtists = (
    artistIds: Array<string>,
    options: {
        /** Save the releases without notifying */
        isSilent: boolean
    },
) =>
    Effect.forEach(
        artistIds,
        artistId =>
            checkArtist(artistId, options.isSilent).pipe(
                // Already recorded by each channel
                Effect.catchTag('NotificationError', () => Effect.void),
                Effect.catchCause(cause => recordFailure(`Artist ${artistId}`, cause)),
            ),
        { discard: true },
    )

const program = checkArtists(env.DISCOGS_ARTIST_IDS, {
    // `npm start -- --silent`: save the releases without notifying, to initialize the database
    isSilent: process.argv.includes('--silent'),
}).pipe(
    // Discogs and the database are opened for the whole run, and closed at the end
    Effect.provide(Layer.mergeAll(DiscogsLive, ItemsLive)),
    // Unexpected error, or Discogs or the database could not be opened
    Effect.catchCause(cause => recordFailure('Run', cause)),
    Effect.andThen(reportFailures),
    // Notification channels, also used to report the errors
    Effect.provide(Layer.mergeAll(MailLive, DiscordLive, FailuresLive)),
)

// Only when run, not when imported by the tests
if (import.meta.main) {
    const failuresCount = await Effect.runPromise(program)
    process.exit(failuresCount > 0 ? 1 : 0)
}
