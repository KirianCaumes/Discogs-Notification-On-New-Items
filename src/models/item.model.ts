import mongoose from 'mongoose'

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

const Item = mongoose.model('Item', itemSchema)

export default Item
