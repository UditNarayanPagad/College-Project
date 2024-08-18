const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/college');

const postSchema = mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    eventName:{
        type: String,
        require: true,
    },
    photo:{
        path: String,
        filename: String
    },
    details:{
        type: String,
        require: true,
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('post',postSchema)