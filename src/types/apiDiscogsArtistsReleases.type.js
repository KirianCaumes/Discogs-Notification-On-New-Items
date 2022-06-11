/**
 * @typedef {object} ApiDiscogsArtistsReleasesType
 * @property {object} pagination pagination
 * @property {number} pagination.page page
 * @property {number} pagination.pages pages
 * @property {number} pagination.per_page per_page
 * @property {number} pagination.items items
 * @property {object} pagination.urls urls
 * @property {string} pagination.urls.last last
 * @property {string} pagination.urls.next next
 * @property {object[]} releases releases
 * @property {number} releases.id id
 * @property {string} releases.title title
 * @property {'release'|'master'} releases.type type
 * @property {number} releases.main_release main_release
 * @property {string} releases.artist artist
 * @property {string} releases.role role
 * @property {string} releases.resource_url resource_url
 * @property {number} releases.year year
 * @property {string} releases.thumb thumb
 * @property {object} releases.stats stats
 * @property {object} releases.stats.community community
 * @property {number} releases.stats.community.in_wantlist in_wantlist
 * @property {number} releases.stats.community.in_collection in_collection
 * @property {string} releases.status status
 * @property {string} releases.format format
 * @property {string} releases.label label
 * @property {string} releases.trackinfo trackinfo
 */
