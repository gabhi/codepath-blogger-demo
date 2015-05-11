let mongoose = require('mongoose')
//let bcrypt = require('bcrypt')

require('songbird')

let userSchema = mongoose.Schema({
  email: String,
  password: String
})

userSchema.methods.generateHash = async function(password) {
//  return await bcrypt.promise.hash(password, 8)
  return  password

}

userSchema.methods.validatePassword = async function(password) {
//  return await bcrypt.promise.compare(password, this.password)
  return  password === this.password

}

module.exports = mongoose.model('User', userSchema)
