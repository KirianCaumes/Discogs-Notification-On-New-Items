import mongoose from 'mongoose'

/**
 * @typedef {{id: number, title: string}} ItemSchema
 */

/** @type {mongoose.Schema<ItemSchema>} */
const itemSchema = new mongoose.Schema(
    {
        id: { type: Number },
        title: { type: String },
    },
    {
        timestamps: true,
    },
)

/**
 * @typedef {mongoose.Model<ItemSchema>} ItemModel
 */

/** @type {ItemModel} */
const Item = mongoose.model('Item', itemSchema)

export default Item
