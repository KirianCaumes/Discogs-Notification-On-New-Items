import type Failure from 'interfaces/failure.interface'
import type { Release } from 'utils/discogs.util'

/**
 * New releases of an artist, to send on a channel
 */
export interface ReleasesNotification {
    /** Title: subject of the mail, first line of the Discord message */
    title: string
    /** Artist id */
    artistId: string
    /** Artist name */
    name: string
    /** New releases */
    releases: Array<Release>
    /** Date of the run */
    date: Date
}

/**
 * Errors of the run, to send on a channel
 */
export interface FailuresNotification {
    /** Title: subject of the mail, first line of the Discord message */
    title: string
    /** Errors */
    failures: Array<Failure>
    /** Date of the run */
    date: Date
}
