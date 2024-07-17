export default interface ApiDiscogsMastersVersions {
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
    }
    /** Filters */
    filters: {
        /** Available */
        available: {
            /** Format */
            format: object
            /** Label */
            label: object
            /** Country */
            country: object
            /** Released */
            released: object
        }
    }
    /** Filter_facets */
    filter_facets: {
        /** Title */
        title: string
        /** Id */
        id: string
        /** Values */
        values: {
            /** Title */
            title: string
            /** Value */
            value: string
            /** Count */
            count: number
        }
        /** Allows_multiple_values */
        allows_multiple_values: boolean
    }
    /** Versions */
    versions: {
        /** Id */
        id: number
        /** Label */
        label: string
        /** Country */
        country: string
        /** Title */
        title: string
        /** Major_formats */
        major_formats: Array<string>
        /** Format */
        format: string
        /** Catno */
        catno: string
        /** Released */
        released: string
        /** Status */
        status: string
        /** Resource_url */
        resource_url: string
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
    }
}
