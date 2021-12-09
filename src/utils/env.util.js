import dotenv from 'dotenv'

dotenv.config()

/**
 * Env variables
 */
const env = {
    DISCOGS_ARTIST_ID: process.env.DISCOGS_ARTIST_ID,
    DISCOGS_API_KEY: process.env.DISCOGS_API_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM || 'example@example.com',
    MAIL_REPLY: process.env.MAIL_REPLY || 'example@example.com',
    MAIL_TO: process.env.MAIL_TO,
    DB_URI: process.env.DB_URI,
}

export default env
