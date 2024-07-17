export default interface ApiDiscogsReleases {
    /** Id */
    id: number
    /** Status */
    status: string
    /** Year */
    year: number
    /** Resource_url */
    resource_url: string
    /** Uri */
    uri: string
    /** Artists */
    artists: {
        /** Name */
        name: string
        /** Anv */
        anv: string
        /** Join */
        join: string
        /** Role */
        role: string
        /** Tracks */
        tracks: string
        /** Id */
        id: number
        /** Resource_url */
        resource_url: string
    }
    /** Artists_sort */
    artists_sort: string | undefined
    /** Labels */
    labels: {
        /** Name */
        name: string
        /** Catno */
        catno: string
        /** Entity_type */
        entity_type: string
        /** Entity_type_name */
        entity_type_name: string
        /** Id */
        id: number
        /** Resource_url */
        resource_url: string
    }
    /** Series */
    series: Array<unknown>
    /** Companies */
    companies: {
        /** Name */
        name: string
        /** Catno */
        catno: string
        /** Entity_type */
        entity_type: string
        /** Entity_type_name */
        entity_type_name: string
        /** Id */
        id: number
        /** Resource_url */
        resource_url: string
    }
    /** Formats */
    formats: {
        /** Name */
        name: string
        /** Qty */
        qty: string
        /** Descriptions */
        descriptions: Array<string>
    }
    /** Data_quality */
    data_quality: string
    /** Community */
    community: {
        /** Have */
        have: number
        /** Want */
        want: number
        /** Rating */
        rating: {
            /** Count */
            count: number
            /** Average */
            average: number
        }
        /** Submitter */
        submitter: {
            /** Username */
            username: string
            /** Resource_url */
            resource_url: string
        }
        /** Contributors */
        contributors: {
            /** Username */
            username: string
            /** Resource_url */
            resource_url: string
        }
        /** Data_quality */
        data_quality: string
        /** Status */
        status: string
    }
    /** Format_quantity */
    format_quantity: number
    /** Date_added */
    date_added: string
    /** Date_changed */
    date_changed: string
    /** Num_for_sale */
    num_for_sale: number
    /** Lowest_price */
    lowest_price: number
    /** Master_id */
    master_id: number
    /** Master_url */
    master_url: string
    /** Title */
    title: string
    /** Country */
    country: string
    /** Notes */
    notes: string
    /** Identifiers */
    identifiers: {
        /** Type */
        type: string
        /** Value */
        value: string
        /** Description */
        description: string
    }
    /** Videos */
    videos: {
        /** Uri */
        uri: string
        /** Title */
        title: string
        /** Description */
        description: string
        /** Duration */
        duration: number
        /** Embed */
        embed: boolean
    }
    /** Genres */
    genres: Array<string>
    /** Styles */
    styles: Array<string>
    /** Tracklist */
    tracklist: Array<{
        /** Position */
        position: string
        /** Type_ */
        type_: string
        /** Title */
        title: string
        /** Duration */
        duration: string
        /** Extraartists */
        extraartists: Array<{
            /** Name */
            name: string
            /** Anv */
            anv: string
            /** Join */
            join: string
            /** Role */
            role: string
            /** Tracks */
            tracks: string
            /** Id */
            id: number
            /** Resource_url */
            resource_url: string
        }>
        /** Artists */
        artists: Array<{
            /** Name */
            name: string
            /** Anv */
            anv: string
            /** Join */
            join: string
            /** Role */
            role: string
            /** Tracks */
            tracks: string
            /** Id */
            id: number
            /** Resource_url */
            resource_url: string
        }>
    }>
    /** Extraartists */
    extraartists: Array<object> | undefined
    /** Name */
    name: string
    /** Anv */
    anv: string
    /** Join */
    join: string
    /** Role */
    role: string
    /** Tracks */
    tracks: string
    /** Images */
    images: {
        /** Type */
        type: string
        /** Uri */
        uri: string
        /** Resource_url */
        resource_url: string
        /** Uri150 */
        uri150: string
        /** Width */
        width: number
        /** Height */
        height: number
    }
    /** Thumb */
    thumb: string
    /** Estimated_weight */
    estimated_weight: number
    /** Blocked_from_sale */
    blocked_from_sale: boolean
}
