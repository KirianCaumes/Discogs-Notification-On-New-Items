import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import Database from 'better-sqlite3'

if (!existsSync('data')) {
    await mkdir('data', { recursive: true })
}
if (!existsSync('data/project.db')) {
    await writeFile('data/project.db', '')
}

const db: InstanceType<typeof Database> = new Database('data/project.db')

// Create the table if it doesn't exist
db.prepare(
    `
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER,
    title TEXT,
    artistId TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, artistId)
);
`,
).run()

interface Item {
    /** Id */
    id: number
    /** Title */
    title: string
    /** Artist Id */
    artistId: string
    /** Created at */
    createdAt: string
    /** Updated at */
    updatedAt: string
}

/**
 * Item model with better-sqlite3
 */
const Item = {
    /**
     * Get all items
     * @returns Promise with all items in DB
     */
    getAllIdsByArtistId: async ({ artistId }: Pick<Item, 'artistId'>) =>
        Promise.resolve(db.prepare(`SELECT id FROM items WHERE artistId = ?`).all(artistId) as Array<Pick<Item, 'id'>>),
    /**
     * Upsert item by id
     * @returns Promise with the result of the query
     */
    upsert: async ({ id, artistId }: Pick<Item, 'id' | 'artistId'>, { title }: Pick<Item, 'title'>) =>
        Promise.resolve(
            db
                .prepare(
                    `
                INSERT INTO items (id, artistId, title, createdAt, updatedAt) 
                VALUES (?, ?, ?, datetime('now'), datetime('now'))
                ON CONFLICT(id, artistId) DO UPDATE SET 
                    title = excluded.title, 
                    updatedAt = datetime('now')
                `,
                )
                .run(id, artistId, title),
        ),
}

export default Item
