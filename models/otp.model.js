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
        type: Date,
        expires: "60" // document will be removed in 1 minutes
    }
})

module.exports = new mongoose.model('Otp', otpSchema)