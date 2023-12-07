import axios from 'axios'
import env from './env.util.js'

const { request } = axios.create({
    baseURL: 'https://api.discogs.com/',
    headers: {
        'User-Agent': 'discogsnewreleasenotification',
    },
    params: {
        token: env.DISCOGS_API_KEY,
    },
})

export default request
