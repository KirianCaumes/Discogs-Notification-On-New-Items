/* eslint-disable no-restricted-syntax */
import { readFileSync } from 'fs'
import { setTimeout } from 'timers/promises'
import mongoose from 'mongoose'
import Handlebars from 'handlebars'
import Item from 'models/item.model'
import env from 'utils/env.util'
import request from 'utils/request.util'
import sendMail from 'utils/send-mail.util'
import type ApiDiscogsArtists from 'interfaces/api-discogs-artists.interface'
import type ApiDiscogsArtistsReleases from 'interfaces/api-discogs-artists-releases.interface'
import type ApiDiscogsMastersVersions from 'interfaces/api-discogs-masters-versions.interface'
import type ApiDiscogsReleases from 'interfaces/api-discogs-releases.interface'

const MAX_RELEASE_PER_PAGE = 500
const MAX_VERSION_PER_PAGE = 100

/** Date at the start of the execution */
const dt = new Date()

// Connect to DB
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
await mongoose.connect(env.DB_URI!)

for (const artistId of env.DISCOGS_ARTIST_IDS) {
    // eslint-disable-next-line no-console
    console.log(`Artist: ${artistId}`)

    /**
     * Get information for the artist
     */
    const { data: artist } = await request<ApiDiscogsArtists>({
        url: `artists/${artistId}`,
    })

    // eslint-disable-next-line no-console
    console.log('Getting releases data')

    /**
     * Get number of releases for a given artist
     */
    const releasesTotalResult = await request<ApiDiscogsArtistsReleases>({
        url: `artists/${artistId}/releases`,
        params: {
            per_page: 1,
        },
    })

    /**
     * Get all releases for a given artist
     */
    const releasesResults = await Promise.all(
        new Array(Math.ceil(releasesTotalResult.data.pagination.items / MAX_RELEASE_PER_PAGE)).fill({}).map((_, i) =>
            request<ApiDiscogsArtistsReleases>({
                url: `artists/${artistId}/releases`,
                params: {
                    per_page: MAX_RELEASE_PER_PAGE,
                    page: i + 1,
                },
            }),
        ),
    )

    /** Array of releases: data are transformed and cleaned */
    const releases = releasesResults
        .map(releasesResult => releasesResult.data.releases)
        .flat()
        .map(release => ({
            id: release.id,
            type: release.type,
            artist: release.artist,
            label: release.label,
            title: release.title,
            format: release.format,
            date: release.year?.toString(),
            thumb: release.thumb,
            role: release.role.match(/[A-Z][a-z]+/g)?.join(' '),
        }))

    /** Release of type `release` found */
    const releasesFound = releases.filter(release => release.type === 'release')

    /** Release of type `master` found */
    const mastersFound = releases.filter(release => release.type === 'master')

    // eslint-disable-next-line no-console
    console.log('Getting masters data')

    // As releases on Discogs API can also be of type 'master' (this type of release is a folder of releases), we need to get all releases of a master
    for (const [index, master] of mastersFound.entries()) {
        // Print first, last and every ten elements
        if (index === 0 || (index + 1) % 10 === 0 || index === mastersFound.length - 1) {
            // eslint-disable-next-line no-console
            console.log(`Master ${index + 1}/${mastersFound.length}`)
        }

        /**
         * Get number of versions for a given master
         */
        const mastersTotalResult = await request<ApiDiscogsMastersVersions>({
            url: `masters/${master.id}/versions`,
            params: {
                per_page: 1,
            },
        })

        /**
         * Get all versions for a given master
         */
        const mastersResults = await Promise.all(
            new Array(Math.ceil(mastersTotalResult.data.pagination.items / MAX_VERSION_PER_PAGE)).fill({}).map((_, i) =>
                request<ApiDiscogsMastersVersions>({
                    url: `masters/${master.id}/versions`,
                    params: {
                        per_page: MAX_VERSION_PER_PAGE,
                        page: i + 1,
                    },
                }),
            ),
        )

        // Add releases from master to `releasesFound`
        for (const version of mastersResults.map(mastersResult => mastersResult.data.versions).flat()) {
            releasesFound.push({
                id: version.id,
                type: 'release',
                artist: master.artist,
                label: version.label,
                title: version.title,
                format: version.format,
                date: version.released !== '0' ? version.released : undefined,
                thumb: version.thumb,
                role: master.role?.match(/[A-Z][a-z]+/g)?.join(' '),
            })
        }

        // If not last item, sleep some times to prevent being blocked
        if (index !== mastersFound.length - 1) {
            await setTimeout(2500)
        }
    }

    /**
     * Items found from DB
     */
    const itemsDb = await Item.find({ artistId })

    /** List of item to send by mail */
    const releasesToSend = releasesFound
        .filter(itemFound => !itemsDb.map(itemDb => itemDb.id as number).includes(itemFound.id))
        .sort((a, b) => (a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title) || a.role?.localeCompare(b.role ?? '')) ?? 0)
        .filter((itemFound, index, self) => self.findIndex(item => item.id === itemFound.id) === index)

    /** Release with the role Appearance or Track Appearance */
    const appearances = releasesToSend.filter(release => ['Track Appearance', 'Appearance'].includes(release.role ?? ''))

    // Check if appearance truly include artist
    for (const [index, appearance] of appearances.entries()) {
        // Print first, last and every ten elements
        if (index === 0 || (index + 1) % 10 === 0 || index === appearances.length - 1) {
            // eslint-disable-next-line no-console
            console.log(`Appearance ${index + 1}/${appearances.length}`)
        }

        /**
         * Releases found
         */
        const releaseResult = await request<ApiDiscogsReleases>({
            url: `releases/${appearance.id}`,
        })

        // If artist not found delete from releasesToSend
        if (
            !releaseResult.data.tracklist
                .map(x => [...(x.extraartists ?? []), ...(x.artists ?? [])])
                .flat()
                .some(x => x.id.toString() === artistId)
        ) {
            releasesToSend.splice(
                releasesToSend.findIndex(x => x.id === releaseResult.data.id),
                1,
            )
        }

        // If not last item, sleep some times to prevent being blocked
        if (index !== appearances.length - 1) {
            await setTimeout(2500)
        }
    }

    // If new items found, send mail
    if (releasesToSend.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`Sending mail: ${releasesToSend.length} new item(s) found`)
        await sendMail({
            subject: `${artist.name} - ${releasesToSend.length.toLocaleString(env.LOCALE)} New Release${
                releasesToSend.length > 1 ? 's' : ''
            }`,
            html: Handlebars.compile(readFileSync('./src/templates/mail.template.hbs').toString())({
                itemsLength: releasesToSend.length.toLocaleString(env.LOCALE),
                artist,
                date: dt.toLocaleDateString(env.LOCALE, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                items: releasesToSend,
                previewVoids: new Array(50).fill('&#847; &zwnj; &nbsp; &#8199; &shy;'),
            }),
        })
    } else {
        // eslint-disable-next-line no-console
        console.log('No data to send')
    }

    // Upsert data found in DB
    await Promise.all(
        releasesFound.map(item =>
            Item.findOneAndUpdate(
                { id: item.id, artistId },
                { id: item.id, title: `${item.artist} - ${item.title}`, artistId },
                { upsert: true },
            ),
        ),
    )

    // eslint-disable-next-line no-console
    console.log('Done\r')
}

// Disconnect from DB
await mongoose.disconnect()

process.exit(0)
