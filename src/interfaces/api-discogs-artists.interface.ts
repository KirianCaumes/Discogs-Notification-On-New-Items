export default interface ApiDiscogsArtists {
    /** Name */
    name: string
    /** Id */
    id: number
    /** Resource_url */
    resource_url: string
    /** Uri */
    uri: string
    /** Releases_url */
    releases_url: string
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
    /** Profile */
    profile: string
    /** Urls */
    urls: Array<string>
    /** Namevariations */
    namevariations: Array<string>
    /** Members */
    members: {
        /** Id */
        id: number
        /** Name */
        name: string
        /** Resource_url */
        resource_url: string
        /** Active */
        active: boolean
    }
    /** Data_quality */
    data_quality: string
}
