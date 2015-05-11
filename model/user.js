let mongoose = require('mongoose')
    //let bcrypt = require('bcrypt')
let nodeify = require('bluebird-nodeify')
let uniqueValidator = require('mongoose-unique-validator');

require('songbird')

let userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    blogTitle: {
        type: String,
        unique: true
    },
    blogDescription: String
})

userSchema.plugin(uniqueValidator);

userSchema.methods.generateHash = async function(password) {
    return password
}

userSchema.methods.validatePassword = async function(password) {
    return password === this.password
}

userSchema.path('password').validate((pw) => {
    return pw.length >= 4 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)
})

userSchema.pre('save', function(callback) {
    nodeify(async() => {
        if (!this.isModified('password')) return callback()
        this.password = await this.generateHash(this.password)
    }(), callback)
})

module.exports = mongoose.model('User', userSchema)