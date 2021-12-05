const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    otp: {
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

module.exports = new mongoose.model('Otp', otpSchema)