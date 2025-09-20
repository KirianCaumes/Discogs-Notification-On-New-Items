export default interface ApiDiscogsArtistsReleases {
    /** Pagination */
    pagination: {
        /** Page */
        page: number
        /** Pages */
        pages: number
        /** Per_page */
        per_page: number
        /** Items */
        items: number
        /** Urls */
        urls: {
            /** Last */
            last: string
            /** Next */
            next: string
        }
    }
    /** Releases */
    releases: {
        /** Id */
        id: number
        /** Title */
        title: string
        /** Type */
        type: 'release' | 'master'
        /** Main_release */
        main_release: number
        /** Artist */
        artist: string
        /** Role */
        role: string
        /** Resource_url */
        resource_url: string
        /** Year */
        year?: number
        /** Thumb */
        thumb: string
        /** Stats */
        stats: {
            /** Community */
            community: {
                /** In_wantlist */
                in_wantlist: number
                /** In_collection */
                in_collection: number
            }
        }
        /** Status */
        status: string
        /** Format */
        format: string
        /** Label */
        label: string
        /** Trackinfo */
        trackinfo: string
    }
}
