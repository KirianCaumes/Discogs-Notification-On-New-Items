import { Context, Data, Effect, Layer, Schedule } from 'effect'
import { HTTPError, isUsingImpersonate, Session } from 'impers'
import env from 'utils/env.util'
import type ApiDiscogsArtistDiscography from 'interfaces/api-discogs-artist-discography.interface'
import type ApiDiscogsRelease from 'interfaces/api-discogs-release.interface'

/** Big pages time out more often on Discogs side */
const PER_PAGE = 500
/** Hash of the persisted query `ArtistDiscographyData` used by discogs.com */
const HASH = '548aa99b046800d90e6a9c528a2f3aa7a5cc7982dfe897b11fbba4b5de742048'
/** Categories of the discography, with the role of the artist they mean */
const CATEGORIES = { Releases: 'Main', Appearances: 'Appearance', Unofficial: 'Unofficial', Credits: 'Credit' } as const
const TIMEOUT_SECONDS = 30
/** Window of the rate limit of the Discogs API (25 requests per minute without token, 60 with), which sends no `Retry-After` */
const RATE_LIMIT_WINDOW = '1 minute'

type ReleaseGroup = NonNullable<NonNullable<ApiDiscogsArtistDiscography['data']>['artist']>['releases2']['releaseGroups'][number]

export interface Release {
    /** Id */
    id: number
    /** Title */
    title: string
    /** Artists */
    artist: string
    /** Role of the artist: "Main", "Appearance", "Unofficial" or "Credit" */
    role: string
    /** "2003", "2003-06" or "2003-06-17" */
    date?: string
    /** Thumbnail url */
    thumb?: string
    /** Date added on Discogs: "2005-03-16T02:45:48-08:00", only known once detailed by the REST API */
    dateAdded?: string
    /** "CD, EP, Enhanced"… */
    format?: string
    /** Label */
    label?: string
    /** False when the details are the ones of the release displayed for the master, not of this release */
    isDetailed: boolean
    /** False when the artist is not credited on this version of the master */
    isCredited: boolean
}

/**
 * Error while fetching Discogs
 */
export class DiscogsError extends Data.TaggedError('DiscogsError')<{
    /** Message */
    message: string
    /** Network error, rate limit or server error: worth retrying */
    isRetryable: boolean
}> {}

/**
 * Format the formats of a release
 * @param formats Formats
 * @returns "CD, EP, Enhanced + DVD, DVD-Video"…
 */
const formatFormats = (
    formats: Array<{
        /** "CD", "Vinyl"… */
        name: string
        /** "EP", "Enhanced"… */
        descriptions?: Array<string> | null
        /** Free text, "Digipak"… */
        text?: string | null
    }>,
) => formats.map(format => [format.name, ...(format.descriptions ?? []), format.text].filter(Boolean).join(', ')).join(' + ') || undefined

/**
 * Remove the unknown parts of a date: "1994-06-00" → "1994-06", "0" → undefined
 * @param date Date
 * @returns Date
 */
const formatDate = (date?: string | null) => {
    const value = date?.replace(/(-00)+$/, '').replace(/^0+$/, '')
    return value === '' ? undefined : value
}

/**
 * Join artists with their joining text: ["A", ","], ["B", "&"], ["C", ""] → "A, B & C"
 * @param artists Artists
 * @returns Artists names
 */
const formatArtists = (
    artists: Array<{
        /** Name */
        displayName: string
        /** Text between this artist and the next one */
        joiningText: string | null
    }>,
) =>
    artists
        .map(({ displayName, joiningText }) => {
            const join = (joiningText ?? '').replace(/&amp;/g, '&').trim()
            if (!join) {
                return displayName
            }
            return join === ',' ? `${displayName}, ` : `${displayName} ${join} `
        })
        .join('')
        .trim()

const fetchPage = (session: Session, artistId: string, category: keyof typeof CATEGORIES, page: number) =>
    Effect.tryPromise({
        try: async () => {
            const res = await session.get('https://www.discogs.com/service/catalog/api/graphql', {
                params: {
                    operationName: 'ArtistDiscographyData',
                    variables: JSON.stringify({
                        anv: '',
                        category,
                        countries: [],
                        direction: 'ASC',
                        discogsId: +artistId,
                        field: 'YEAR',
                        formats: [],
                        labels: [],
                        name: '',
                        page,
                        perPage: PER_PAGE,
                        search: '',
                        years: [],
                        excludeAnvs: false,
                    }),
                    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: HASH } }),
                },
                headers: { 'content-type': 'application/json', 'apollographql-client-name': 'release-page-client' },
                timeout: TIMEOUT_SECONDS,
            })
            if (res.statusCode === 403 && res.text.includes('Unsupported query ID')) {
                throw new DiscogsError({
                    message: `Discogs does not know the persisted query anymore: update HASH in src/utils/discogs.util.ts with the one used by discogs.com`,
                    isRetryable: false,
                })
            }
            res.raiseForStatus()
            return res.json<ApiDiscogsArtistDiscography>()
        },
        catch: cause =>
            cause instanceof DiscogsError
                ? cause
                : new DiscogsError({
                      message: `${category} page ${page}: ${String(cause)}`,
                      // Bad request (invalid artist id) or not found will not succeed by retrying
                      isRetryable: !(cause instanceof HTTPError && [400, 404].includes(cause.statusCode)),
                  }),
    }).pipe(
        Effect.flatMap(({ data, errors }) => {
            // Discogs sometimes returns "Resource temporarily unavailable" or a timeout in `errors`, possibly with partial data
            if (errors?.length) {
                return Effect.fail(
                    new DiscogsError({ message: `${category} page ${page}: ${errors[0]?.message ?? ''}`, isRetryable: true }),
                )
            }
            if (data?.artist) {
                return Effect.succeed(data.artist)
            }
            return Effect.fail(new DiscogsError({ message: `Artist ${artistId} not found`, isRetryable: false }))
        }),
        Effect.tapError(error => Effect.logWarning(error.message)),
        Effect.retry({ times: 3, schedule: Schedule.exponential('2 seconds'), while: error => error.isRetryable }),
    )

/**
 * Get every page of a category of the discography
 * @param session Session
 * @param artistId Artist id
 * @param category Category
 * @returns Artist name and release groups
 */
const fetchCategory = (session: Session, artistId: string, category: keyof typeof CATEGORIES) =>
    Effect.gen(function* () {
        let name = ''
        const groups: Array<ReleaseGroup> = []
        // Until every group is fetched, without relying on the page size applied by Discogs
        for (let page = 1; ; page++) {
            const artist = yield* fetchPage(session, artistId, category, page)
            name = artist.name
            groups.push(...artist.releases2.releaseGroups)
            if (artist.releases2.releaseGroups.length === 0 || groups.length >= artist.releases2.totalCount) {
                return { name, groups }
            }
        }
    })

/**
 * Get every release of an artist (all versions of each master included)
 * @param session Session
 * @param artistId Artist id
 * @returns Artist name and releases
 */
const getDiscography = (session: Session, artistId: string) =>
    Effect.gen(function* () {
        const categories = yield* Effect.forEach(
            Object.entries(CATEGORIES) as Array<[keyof typeof CATEGORIES, string]>,
            ([category, role]) => fetchCategory(session, artistId, category).pipe(Effect.map(result => ({ ...result, role }))),
        )

        /** Releases by id: a release can be in several categories, the first one wins */
        const releases = new Map<number, Release>()
        categories
            .flatMap(({ role, groups }) => groups.map(({ displayRelease }) => ({ role, release: displayRelease })))
            .forEach(({ role, release }) => {
                ;[...new Set([release.discogsId, ...(release.masterRelease?.allVersionIds ?? [])])]
                    .filter(id => !releases.has(id))
                    .forEach(id =>
                        releases.set(id, {
                            id,
                            title: release.title,
                            artist: formatArtists(release.primaryArtists),
                            role,
                            date: formatDate(release.released),
                            thumb: release.images.edges[0]?.node.thumbnail.sourceUrl,
                            format: formatFormats(release.formats.map(format => ({ ...format, descriptions: format.description }))),
                            label: release.labels.find(label => label.labelRole === 'LABEL')?.displayName,
                            isDetailed: id === release.discogsId,
                            // Discogs lists the displayed release because the artist is on it, other versions are checked with their details
                            isCredited: true,
                        }),
                    )
            })

        return { name: categories[0]?.name ?? artistId, releases: [...releases.values()] }
    })

/**
 * Whether an artist is credited on a release, its tracks included
 * @param data Release
 * @param artistId Artist id
 * @returns Whether the artist is credited
 */
const isArtistCredited = (data: ApiDiscogsRelease, artistId: string) => {
    /**
     * Get the ids of the artists of a track and its sub tracks
     * @param track Track
     * @returns Ids
     */
    const getIds = (
        track: Pick<ApiDiscogsRelease['tracklist'][number], 'artists' | 'extraartists' | 'sub_tracks'>,
    ): Array<number | null> => [
        ...(track.artists ?? []).map(artist => artist.id),
        ...(track.extraartists ?? []).map(artist => artist.id),
        ...(track.sub_tracks ?? []).flatMap(getIds),
    ]
    return [data, ...data.tracklist].flatMap(getIds).includes(+artistId)
}

/**
 * Get the details of a release from the Discogs API: its date added, and its own details when the GraphQL API only gave the ones of its master.
 * If the release can not be fetched (deleted, blocked…), it keeps the details it has.
 * @param release Release
 * @param artistId Artist id
 * @returns Release with its own details
 */
const getReleaseDetails = (release: Release, artistId: string) => {
    const fetchRelease = Effect.tryPromise({
        try: async () => {
            const res = await fetch(`https://api.discogs.com/releases/${release.id}`, {
                headers: {
                    'User-Agent': 'discogs-notification-on-new-items',
                    ...(env.DISCOGS_API_KEY ? { Authorization: `Discogs token=${env.DISCOGS_API_KEY}` } : {}),
                },
                signal: AbortSignal.timeout(TIMEOUT_SECONDS * 1000),
            })
            const text = await res.text()
            return { status: res.status, text, data: res.ok ? (JSON.parse(text) as ApiDiscogsRelease) : undefined }
        },
        catch: cause => new DiscogsError({ message: `Release ${release.id}: ${String(cause)}`, isRetryable: true }),
    }).pipe(
        Effect.flatMap(({ status, text, data }) => {
            if (data) {
                return Effect.succeed(data)
            }
            const error = new DiscogsError({
                message: `Release ${release.id}: ${status} ${text}`,
                isRetryable: status === 429 || status >= 500,
            })
            // Rate limited: wait for the window to pass before retrying
            return status === 429
                ? Effect.logWarning(`Rate limited by the Discogs API, waiting ${RATE_LIMIT_WINDOW}`).pipe(
                      Effect.andThen(Effect.sleep(RATE_LIMIT_WINDOW)),
                      Effect.andThen(Effect.fail(error)),
                  )
                : Effect.fail(error)
        }),
    )

    return fetchRelease.pipe(
        Effect.tapError(error => Effect.logWarning(error.message)),
        Effect.retry({ times: 3, schedule: Schedule.exponential('2 seconds'), while: error => error.isRetryable }),
        Effect.map((data): Release => {
            if (release.isDetailed) {
                return { ...release, dateAdded: data.date_added }
            }
            return {
                ...release,
                title: data.title,
                date: formatDate(data.released),
                thumb: data.thumb === '' ? undefined : data.thumb,
                dateAdded: data.date_added,
                format: formatFormats(data.formats),
                label: data.labels[0]?.name,
                isDetailed: true,
                // Other versions of a compilation do not always include the artist
                isCredited: isArtistCredited(data, artistId),
            }
        }),
        // A permanent error must not block the artist: keep the details of the master, but without the tracklist the artist can only be
        // considered credited on its own releases. A temporary error still fails, so the release is checked again on the next run.
        Effect.catchTag('DiscogsError', error => {
            if (error.isRetryable) {
                return Effect.fail(error)
            }
            return Effect.succeed(release.isDetailed ? release : { ...release, isCredited: release.role === 'Main' })
        }),
    )
}

/**
 * Discogs: GraphQL API of discogs.com for the discographies, REST API for the details of a release
 */
export class Discogs extends Context.Service<
    Discogs,
    {
        /** Get every release of an artist (all versions of each master included) */
        readonly getDiscography: (artistId: string) => Effect.Effect<
            {
                /** Artist name */
                name: string
                /** Releases */
                releases: Array<Release>
            },
            DiscogsError
        >
        /** Get the details of a release: its date added, and its own details when the discography only gave the ones of its master */
        readonly getReleaseDetails: (release: Release, artistId: string) => Effect.Effect<Release, DiscogsError>
    }
>()('Discogs') {}

/**
 * Discogs with one impersonated session for the whole run
 */
export const DiscogsLive = Layer.effect(
    Discogs,
    Effect.gen(function* () {
        // Plain curl is blocked by Discogs
        if (!(yield* Effect.promise(() => isUsingImpersonate()))) {
            return yield* Effect.fail(
                new DiscogsError({
                    message:
                        'impers could not load curl-impersonate, Discogs would block the requests: check the access to GitHub or set LIBCURL_PATH',
                    isRetryable: false,
                }),
            )
        }

        const session = yield* Effect.acquireRelease(
            Effect.sync(() => new Session({ impersonate: 'chrome' })),
            s => Effect.promise(() => s.close()),
        )

        return {
            getDiscography: artistId => getDiscography(session, artistId),
            getReleaseDetails,
        }
    }),
)
