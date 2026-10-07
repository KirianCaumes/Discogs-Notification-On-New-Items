/**
 * Response of https://api.discogs.com/releases/{id}
 */
export default interface ApiDiscogsRelease {
    /** Id */
    id: number
    /** "Accepted", "Draft"… */
    status: string
    /** Year, 0 when unknown */
    year: number
    /** Url on the API */
    resource_url: string
    /** Url on discogs.com */
    uri: string
    /** Artists */
    artists: Array<{
        /** Id, null when the artist does not exist anymore (draft releases) */
        id: number | null
        /** Name */
        name: string
        /** Name variation used on the release, empty when none */
        anv: string
        /** Text joining this artist to the next one: ",", "&", "Feat."… empty when none */
        join: string
        /** Role, empty for the main artists: "Producer", "Written-By"… */
        role: string
        /** Tracks the credit applies to: "A1 to B2", empty for every track */
        tracks: string
        /** Url on the API, null when the artist does not exist anymore */
        resource_url: string | null
        /** Thumbnail url, absent when the artist has no image */
        thumbnail_url?: string
    }>
    /** Credited artists, absent when none */
    extraartists?: ApiDiscogsRelease['artists']
    /** Artists, as sorted on Discogs: "Beatles, The"… */
    artists_sort: string
    /** Labels */
    labels: Array<{
        /** Id, null when the label does not exist anymore (draft releases) */
        id: number | null
        /** Name */
        name: string
        /** Catalog number, empty when none */
        catno: string
        /** Type id: "1" for a label, "2" for a series… */
        entity_type: string
        /** Type name: "Label", "Series", "Pressed By"… */
        entity_type_name: string
        /** Url on the API, null when the label does not exist anymore */
        resource_url: string | null
        /** Thumbnail url, absent when the label has no image */
        thumbnail_url?: string
    }>
    /** Series */
    series: ApiDiscogsRelease['labels']
    /** Companies: pressing plant, copyrights… */
    companies: ApiDiscogsRelease['labels']
    /** Formats */
    formats: Array<{
        /** "CD", "Vinyl"… */
        name: string
        /** Quantity: "1", "2"… */
        qty: string
        /** "EP", "Enhanced"… */
        descriptions?: Array<string>
        /** Free text, "Digipak"… */
        text?: string
    }>
    /** Total number of items, of every format */
    format_quantity: number
    /** "Needs Vote", "Correct", "Complete and Correct"… */
    data_quality: string
    /** Community */
    community: {
        /** Users who have it */
        have: number
        /** Users who want it */
        want: number
        /** Rating */
        rating: {
            /** Number of votes */
            count: number
            /** Average, out of 5 */
            average: number
        }
        /** User who submitted the release, null when the account was deleted */
        submitter: {
            /** Username */
            username: string
            /** Url on the API */
            resource_url: string
        } | null
        /** Users who contributed to the release */
        contributors: Array<{
            /** Username */
            username: string
            /** Url on the API */
            resource_url: string
        }>
        /** "Needs Vote", "Correct"… */
        data_quality: string
        /** "Accepted", "Draft"… */
        status: string
    }
    /** Date added on Discogs: "2005-03-16T02:45:48-08:00" */
    date_added: string
    /** Date of the last change: "2026-01-27T06:18:09-08:00" */
    date_changed: string
    /** Number of listings on the marketplace */
    num_for_sale: number
    /** Lowest price on the marketplace, null when not for sale */
    lowest_price: number | null
    /** Master id, absent when the release is not part of a master */
    master_id?: number
    /** Master url on the API, absent when the release is not part of a master */
    master_url?: string
    /** Title */
    title: string
    /** "Germany", "Europe"… */
    country: string | null
    /** "2003-06-10", "2003-06-00", "2003" or "0", absent when unknown */
    released?: string
    /** "10 Jun 2003", "Jun 2003" or "2003", absent when unknown */
    released_formatted?: string
    /** Notes, absent when none */
    notes?: string
    /** Barcodes, matrix… */
    identifiers: Array<{
        /** "Barcode", "Matrix / Runout", "Label Code"… */
        type: string
        /** Value */
        value: string
        /** "Text", "Side A"… */
        description?: string
    }>
    /** Videos */
    videos: Array<{
        /** Url */
        uri: string
        /** Title */
        title: string
        /** Description, null when none */
        description: string | null
        /** Duration in seconds */
        duration: number
        /** Can be embedded */
        embed: boolean
    }>
    /** "Electronic", "Rock"… */
    genres: Array<string>
    /** "Techno", "Indie Rock"… */
    styles: Array<string>
    /** Tracklist */
    tracklist: Array<{
        /** "A1", "1", "1-01"… empty for a heading or an index track */
        position: string
        /** "index" is a track with sub tracks */
        type_: 'track' | 'index' | 'heading'
        /** Title */
        title: string
        /** "4:39", empty when unknown */
        duration: string
        /** Artists, when different from the ones of the release */
        artists?: ApiDiscogsRelease['artists']
        /** Credited artists */
        extraartists?: ApiDiscogsRelease['artists']
        /** Sub tracks of an index track */
        sub_tracks?: ApiDiscogsRelease['tracklist']
    }>
    /** Images */
    images: Array<{
        /** Type */
        type: 'primary' | 'secondary'
        /** Url */
        uri: string
        /** Url, same as `uri` */
        resource_url: string
        /** Url of the thumbnail */
        uri150: string
        /** Width */
        width: number
        /** Height */
        height: number
    }>
    /** Thumbnail url, empty when there is no image */
    thumb: string
    /** Estimated weight in grams, null when unknown */
    estimated_weight: number | null
    /** Can not be sold on the marketplace */
    blocked_from_sale: boolean
    /** Offensive content */
    is_offensive: boolean
}
