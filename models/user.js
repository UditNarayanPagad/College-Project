const mongoose = require('mongoose');

const mongoConnect = require('../index')

const userSchema = mongoose.Schema({
    username:{
        type: String,
        require: true,
    },
    email:{
        type: String,
        require: true,
        unique: true,
    },
    password:{
        type: String,
        require: true,
    },
    createdEvent:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ],
    posts:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]
})

module.exports = mongoose.model('user',userSchema)