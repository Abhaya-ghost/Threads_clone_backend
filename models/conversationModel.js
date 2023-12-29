const mongoose = require('mongoose')

const convoSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        text: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        seen: {
            type:Boolean,
            default: false,
        }
    },
}, {
    timestamps: true
})

const Convo = mongoose.model('Convo', convoSchema)

module.exports = Convo