const mongoose = require('mongoose');

const mongoConnect = require('../index')

const photoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    path: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true
    },
    photos: [photoSchema],
    details: {
        type: String,
        required: true
    }
});
// const postSchema = mongoose.Schema({
//     userId:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'user'
//     },
//     eventName:{
//         type: String,
//         require: true,
//     },
//     photo:{
//         path: String,
//         filename: String
//     },
//     details:{
//         type: String,
//         require: true,
//     },
//     createdDate: {
//         type: Date,
//         default: Date.now
//     }
// })

module.exports = mongoose.model('post',postSchema)