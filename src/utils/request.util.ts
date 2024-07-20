import axios from 'axios'
import env from 'utils/env.util'

const { request } = axios.create({
    baseURL: 'https://api.discogs.com/',
    headers: {
        'User-Agent': 'discogs-notification-on-new-items',
    },
    params: {
        token: env.DISCOGS_API_KEY,
    },
})

export default request
