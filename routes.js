let multiparty = require('multiparty')
let then = require('express-then')
let fs = require('fs')
let isLoggedIn = require('./middleware/isLoggedIn')
let User = require('./model/user')
let Post = require('./model/post')
let util = require('util')
let DataUri = require('datauri')

module.exports = (app) => {
    let passport = app.passport

    app.get('/', (req, res) => {
        res.render('index.ejs')
    })

    app.get('/login', (req, res) => {
        res.render('login.ejs', {
            message: req.flash('error')
        })
    })
    app.post('/login', passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {
            message: req.flash('error')
        })
    })

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }))

    app.get('/profile', isLoggedIn, then(async(req, res) => {
        let posts = await Post.promise.find({
                user_id: req.user._id
            })
            //console.log("profile posts", posts)
        let comments = []
        for (let post of posts) {
            if (post.comments && post.comments.length > 0) {
                // take the last comment in the array as the latest comment
                let comment = post.comments[post.comments.length - 1]

                comments.push({
                    content: comment.content.substr(0, 124),
                    username: comment.username,
                    created: comment.created,
                    postLink: "/post/" + post._id
                })
            }
        }
        res.render('profile.ejs', {
            user: req.user,
            posts: posts,
            comments: comments,
            message: req.flash('error')
        })
    }))

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/post/:postId?', isLoggedIn, then(async(req, res) => {
        let postId = req.params.postId
        if (!postId) {
            res.render('post.ejs', {
                post: {},
                verb: 'Create'
            })
            return
        }
        let post = await Post.promise.findById(postId)
        if (!post) res.status(404).send('Not found')

        let dataUri = new DataUri()
        let image
        let imageData
        if (post.image.data) {
            image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
            imageData = `data:${post.image.contentType};base64,${image.base64}`
            //console.log(image)
        }
        res.render('post.ejs', {
            post: post,
            verb: 'Edit',
            image: imageData
        })

    }))

    app.post('/post/:postId?', isLoggedIn, then(async(req, res) => {
        let postId = req.params.postId
        let post
        if (!postId) {
            post = new Post()
        } else {
            post = await Post.promise.findById(postId)
            if (!post) res.status(404).send('Not found')
        }

        let [{
            title: [title],
            content: [content]
        }, {
            image: [file]
        }] = await new multiparty.Form().promise.parse(req)
        post.title = title
        post.content = content
        if (file.originalFilename !== '') {
            post.image.data = await fs.promise.readFile(file.path)
            post.image.contentType = file.headers['content-type']
        }
        //console.log(file, title, content, post)

        if (!postId) {
            // assign user id to the post
            post.user_id = req.user._id
        }
        await post.save()
        res.redirect('/blog/' + encodeURI(req.user.blogTitle))
    }))

    app.delete('/post/:postId', isLoggedIn, (req, res) => {
        async() => {
            let postId = req.params.postId
            let post = await Post.promise.findById(postId)
            if (post) await post.promise.remove()
            res.end()
        }().catch(e => console.log('err', e))
    })

    app.get('/blog/:blogTitle', (req, res) => {
        async() => {
            //console.log('blog title', req.params.blogTitle)
            // first find the user by blogTitle
            let user = await User.promise.findOne({
                    blogTitle: req.params.blogTitle
                })
                //console.log('blog user', user)
            if (!user) res.status(404).send('Not found')

            // get the posts by user id
            let posts = await Post.promise.find({
                user_id: user._id
            })

            //console.log('blog posts', posts)
            let dataUri = new DataUri()
            let image
            for (let post of posts) {
                if (post.image.data) {
                    image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
                    // console.log(image)
                    post.imageData = `data:${post.image.contentType};base64,${image.base64}`
                }
            }

            res.render('blog.ejs', {
                posts: posts,
                message: req.flash('error')
            })

        }().catch(e => console.log('err', e))
    })

    app.post('/comment', isLoggedIn, then(async(req, res) => {
        //console.log('comment req.body', req.body)

        let post = await Post.promise.findById(req.body.postId)
        if (post) {
            post.comments.push({
                content: req.body.comment,
                username: req.user.username
            })
            await post.save()
        }

        res.end()
    }))

    app.post('/logincomment', passport.authenticate('local'), then(async(req, res) => {
        //console.log('comment req.body', req.body)

        // get the post document
        let post = await Post.promise.findById(req.body.postId)
        if (post) {
            post.comments.push({
                content: req.body.comment,
                username: req.user.username
            })
            await post.save()
        }

        res.end()
    }))

}