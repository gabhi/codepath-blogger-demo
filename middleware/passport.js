let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../model/user')
let util = require('util')

module.exports = (app) => {
    let passport = app.passport

    passport.serializeUser(nodeifyit(async(user) => user._id))
    passport.deserializeUser(nodeifyit(async(id) => {
        return await User.promise.findById(id)
    }))

    passport.use(new LocalStrategy({
        // Use "email" field instead of "username"
        usernameField: 'username',
        failureFlash: true
    }, nodeifyit(async(username, password) => {
        let user
        if (username.indexOf('@') >= 0) {
            let email = username.toLowerCase()
            user = await User.promise.findOne({
                email
            })
        } else {
            // mongo stores as case-sensive
            let regexp = new RegExp(username, 'i')
            user = await User.promise.findOne({
                username: {
                    $regex: regexp
                }
            })
        }


        if (!user) return [false, {
            message: 'Invalid username or email'
        }]
        if (username.indexOf('@') >= 0) {
            if (username !== user.email) {
                return [false, {
                    message: 'Invalid email'
                }]
            }
        } else if (username !== user.username) {
            return [false, {
                message: 'Invalid username'
            }]
        }
        if (!await user.validatePassword(password)) {
            return [false, {
                message: 'Invalid password'
            }]
        }
        return user

    }, {
        spread: true
    })))


    passport.use('local-signup', new LocalStrategy({
        // Use "email" field instead of "username"
        usernameField: 'email',
        failureFlash: true,
        passReqToCallback: true
    }, nodeifyit(async(req, email, password) => {
        email = (email || '').toLowerCase()
        // Is the email taken?
        if (await User.promise.findOne({
            email
        })) {
            return [false, {
                message: 'That email is already taken.'
            }]
        }

        let {
            username, title, description
        } = req.body
        let regexp = new RegExp(username, 'i')
        let query = {
            username: {
                $regex: regexp
            }
        }
        if (await User.promise.findOne(query)) {
            return [false, {
                message: 'That username is already taken.'
            }]
        }

        // create the user
        let user = new User()
        user.email = email
        user.username = username
        user.blogTitle = title
        user.blogDescription = description
        user.password = password

        try {
            return await user.save()
        } catch (e) {
            //console.log('error on save user', util.inspect(e))
            return [false, {
                message: e.message
            }]
        }
    }, {
        spread: true
    })))
}