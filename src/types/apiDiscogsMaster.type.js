/**
 * @typedef {object} ApiDiscogsMasterType
 * @property {object} pagination pagination
 * @property {number} pagination.page page
 * @property {number} pagination.pages pages
 * @property {number} pagination.per_page per_page
 * @property {number} pagination.items items
 * @property {object} filters filters
 * @property {object} filters.available available
 * @property {object} filters.available.format format
 * @property {object} filters.available.label label
 * @property {object} filters.available.country country
 * @property {object} filters.available.released released
 * @property {object[]} filter_facets filter_facets
 * @property {string} filter_facets.title title
 * @property {string} filter_facets.id id
 * @property {object[]} filter_facets.values values
 * @property {string} filter_facets.values.title title
 * @property {string} filter_facets.values.value value
 * @property {number} filter_facets.values.count count
 * @property {boolean} filter_facets.allows_multiple_values allows_multiple_values
 * @property {object[]} versions versions
 * @property {number} versions.id id
 * @property {string} versions.label label
 * @property {string} versions.country country
 * @property {string} versions.title title
 * @property {string[]} versions.major_formats major_formats
 * @property {string} versions.format format
 * @property {string} versions.catno catno
 * @property {string} versions.released released
 * @property {string} versions.status status
 * @property {string} versions.resource_url resource_url
 * @property {string} versions.thumb thumb
 * @property {object} versions.stats stats
 * @property {object} versions.stats.community community
 * @property {number} versions.stats.community.in_wantlist in_wantlist
 * @property {number} versions.stats.community.in_collection in_collection
 */
