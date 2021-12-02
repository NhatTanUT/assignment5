const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    expire: {
        type: Date
    },
    isUsed: {
        type: Boolean
    }
})

module.exports = new mongoose.model('Token', tokenSchema)