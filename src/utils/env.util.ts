import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ quiet: true })

const schema = z
    .object({
        /** Comma separated artist ids */
        DISCOGS_ARTIST_IDS: z
            .string()
            .transform(ids => ids.split(',').map(id => id.trim()))
            .pipe(z.array(z.string().regex(/^\d+$/, 'Artist ids must be numbers')).min(1)),
        /** Optional, raises the rate limit of the Discogs API from 25 to 60 requests per minute */
        DISCOGS_API_KEY: z.string().optional(),
        /** SQLite database of the releases already seen */
        DB_PATH: z.string().default('data/project.db'),
        MAIL_HOST: z.string().optional(),
        MAIL_PORT: z.coerce.number().int().default(587),
        MAIL_USER: z.string().optional(),
        MAIL_PASS: z.string().optional(),
        MAIL_FROM: z.email().default('example@example.com'),
        MAIL_TO: z.email().optional(),
        DISCORD_WEBHOOK_URL: z.url().optional(),
        LOCALE: z.string().default('EN-us'),
    })
    .refine(env => !env.MAIL_HOST || env.MAIL_TO, { message: 'Required when MAIL_HOST is set', path: ['MAIL_TO'] })
    .refine(env => env.MAIL_HOST !== undefined || env.DISCORD_WEBHOOK_URL !== undefined, {
        message: 'At least one of MAIL_HOST or DISCORD_WEBHOOK_URL must be set',
    })

// Empty variables (`MAIL_HOST=`) are considered as not set
const result = schema.safeParse(Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== '')))

if (!result.success) {
    // eslint-disable-next-line no-console
    console.error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)
    process.exit(1)
}

/**
 * Env variables
 */
const env = result.data

export default env
