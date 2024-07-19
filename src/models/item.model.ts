import mongoose from 'mongoose'

export interface ItemInterface {
    /** Id */
    id: number
    /** Title */
    title: string
    /** ArtistId */
    artistId: string
}

const itemSchema = new mongoose.Schema(
    {
        id: { type: Number },
        title: { type: String },
        artistId: { type: String },
    },
    {
        timestamps: true,
    },
)

const Item = mongoose.model<ItemInterface>('Item', itemSchema)

export default Item
