let mongoose = require('mongoose')
let Schema = mongoose.Schema;

require('songbird')

let commentSchema = Schema({
    content: {
        type: String,
        required: true
    },
    username: String,
    created: {
        type: Date,
        default: Date.now
    }
})


let postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contentType: String
    },
    user_id: Schema.ObjectId,
    comments: [commentSchema],
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
})

postSchema.pre('save', function(next) {
    this.updated = Date.now()
    next()
})

module.exports = mongoose.model('Post', postSchema)