/** Artist credited on a release or a track */
interface ArtistCredit {
    /** Id */
    id: number
}

/** Track */
interface Track {
    /** Artists */
    artists?: Array<ArtistCredit>
    /** Credited artists */
    extraartists?: Array<ArtistCredit>
    /** Sub tracks (index tracks) */
    sub_tracks?: Array<Track>
}

/**
 * Response of https://api.discogs.com/releases/{id}
 * Only the fields used by the project are typed.
 */
export default interface ApiDiscogsRelease {
    /** Id */
    id: number
    /** Title */
    title: string
    /** "2003-06-10", "2003-06-00", "2003" or "0" */
    released?: string
    /** Thumbnail url, empty when there is no image */
    thumb?: string
    /** Formats */
    formats?: Array<{
        /** "CD", "Vinyl"… */
        name: string
        /** "EP", "Enhanced"… */
        descriptions?: Array<string>
        /** Free text, "Digipak"… */
        text?: string
    }>
    /** Labels */
    labels?: Array<{
        /** Name */
        name: string
    }>
    /** Artists */
    artists?: Array<ArtistCredit>
    /** Credited artists */
    extraartists?: Array<ArtistCredit>
    /** Tracklist */
    tracklist?: Array<Track>
}
