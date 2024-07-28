import dotenv from 'dotenv'

dotenv.config()

/**
 * Env variables
 */
const env = {
    DISCOGS_ARTIST_IDS: process.env.DISCOGS_ARTIST_IDS?.split(',') ?? [],
    DISCOGS_API_KEY: process.env.DISCOGS_API_KEY,
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: +process.env.MAIL_PORT!,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    MAIL_FROM: process.env.MAIL_FROM || 'example@example.com',
    MAIL_TO: process.env.MAIL_TO,
    DB_URI: process.env.DB_URI,
    LOCALE: process.env.LOCALE || 'EN-us',
}

export default env
