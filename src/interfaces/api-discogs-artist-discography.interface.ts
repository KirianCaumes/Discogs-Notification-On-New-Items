/**
 * Response of the persisted GraphQL query `ArtistDiscographyData` (https://www.discogs.com/service/catalog/api/graphql)
 * Only the fields used by the project are typed.
 */
export default interface ApiDiscogsArtistDiscography {
    /** Transient errors returned with HTTP 200: "Resource temporarily unavailable.", "Your request has been timed out"… */
    errors?: Array<{
        /** Message */
        message: string
    }>
    /** Data */
    data: {
        /** Artist */
        artist: {
            /** Name */
            name: string
            /** Releases */
            releases2: {
                /** Total number of release groups */
                totalCount: number
                /** Release groups (a master or a single release) */
                releaseGroups: Array<{
                    /** Release displayed for the group */
                    displayRelease: {
                        /** Id */
                        discogsId: number
                        /** Title */
                        title: string
                        /** "1994", "1994-04-00" or "1994-04-01" */
                        released: string | null
                        /** Formats */
                        formats: Array<{
                            /** "CD", "Vinyl"… */
                            name: string
                            /** "EP", "Enhanced"… */
                            description: Array<string> | null
                            /** Free text, "Digipak"… */
                            text: string | null
                        }>
                        /** Labels and companies */
                        labels: Array<{
                            /** Name */
                            displayName: string
                            /** "LABEL", "DISTRIBUTED_BY", "PRESSED_BY"… */
                            labelRole: string
                        }>
                        /** Artists */
                        primaryArtists: Array<{
                            /** Name */
                            displayName: string
                            /** Text between this artist and the next one */
                            joiningText: string | null
                        }>
                        /** Master, if the release is part of one */
                        masterRelease: {
                            /** Ids of every version of the master */
                            allVersionIds: Array<number>
                        } | null
                        /** Images */
                        images: {
                            /** Edges */
                            edges: Array<{
                                /** Node */
                                node: {
                                    /** Thumbnail */
                                    thumbnail: {
                                        /** Url */
                                        sourceUrl: string
                                    }
                                }
                            }>
                        }
                    }
                }>
            }
        } | null
    } | null
}
