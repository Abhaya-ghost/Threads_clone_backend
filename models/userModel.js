const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name : {
        type: String,
        required: true,
    },
    username : {
        type: String,
        required: true,
        unique: true,
    },
    email : {
        type: String,
        required: true,
        unique: true,
    },
    password : {
        type: String,
        required: true,
        minLength: 6,
    },
    profilePic : {
        type: String,
        default: "",
    },
    followers : {
        type: Array,
        default: [],
    },
    following : {
        type: Array,
        default: [],
    },
    bio : {
        type: String,
        default: "",
    }
},{
    timestamps: true
})

const User = mongoose.model('User', userSchema);

module.exports = User