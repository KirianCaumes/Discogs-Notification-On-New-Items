import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { DatabaseSync } from 'node:sqlite'
import { Context, Data, Effect, Layer } from 'effect'
import env from 'utils/env.util'

/**
 * Error with the database
 */
export class DbError extends Data.TaggedError('DbError')<{
    /** Message */
    message: string
}> {}

/**
 * Releases already seen, by artist
 */
export class Items extends Context.Service<
    Items,
    {
        /** Get the ids of the releases already seen for an artist */
        readonly getIds: (artistId: string) => Effect.Effect<Set<number>, DbError>
        /** Insert the new releases of an artist, and update `updatedAt` of the existing ones (last time seen on Discogs) */
        readonly upsertMany: (
            artistId: string,
            items: Array<{
                /** Id */
                id: number
                /** Title */
                title: string
            }>,
        ) => Effect.Effect<void, DbError>
    }
>()('Items') {}

/**
 * Items stored with node:sqlite in `DB_PATH`, opened for the whole run
 */
export const ItemsLive = Layer.effect(
    Items,
    Effect.gen(function* () {
        const db = yield* Effect.acquireRelease(
            Effect.try({
                try: () => {
                    mkdirSync(dirname(env.DB_PATH), { recursive: true })
                    // Wait for a lock (another run still in progress) instead of failing at once
                    const database = new DatabaseSync(env.DB_PATH, { timeout: 5000 })
                    database.exec(`
                  CREATE TABLE IF NOT EXISTS items (
                    id INTEGER,
                    title TEXT,
                    artistId TEXT,
                    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id, artistId)
                  );
                `)
                    return database
                },
                catch: cause => new DbError({ message: String(cause) }),
            }),
            database =>
                Effect.sync(() => {
                    database.close()
                }),
        )

        const select = db.prepare('SELECT id FROM items WHERE artistId = ?')
        // The title is kept: the one of the old database is the one of the version, more precise than the one of its master
        const upsert = db.prepare(`
            INSERT INTO items (id, artistId, title) VALUES (?, ?, ?)
            ON CONFLICT(id, artistId) DO UPDATE SET updatedAt = datetime('now')
        `)

        return {
            getIds: artistId =>
                Effect.try({
                    try: () => new Set(select.all(artistId).map(row => row.id as number)),
                    catch: cause => new DbError({ message: String(cause) }),
                }),
            upsertMany: (artistId, items) =>
                Effect.try({
                    try: () => {
                        db.exec('BEGIN')
                        try {
                            items.forEach(item => upsert.run(item.id, artistId, item.title))
                            db.exec('COMMIT')
                        } catch (error) {
                            db.exec('ROLLBACK')
                            throw error
                        }
                    },
                    catch: cause => new DbError({ message: String(cause) }),
                }),
        }
    }),
)
