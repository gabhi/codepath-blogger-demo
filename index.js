let express = require('express')
let morgan = require('morgan')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
let flash = require('connect-flash')
let mongoose = require('mongoose')
let passportMiddleware = require('./middleware/passport')
let routes = require('./routes')
require('songbird')

// const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000

let app = express()
app.passport = passport

// log every request to the console
app.use(morgan('dev'))

// Read cookies, required for sessions
app.use(cookieParser('ilovethenodejs'))

// Get POST/PUT body information (e.g., from html forms)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Use ejs for templating
app.set('view engine', 'ejs')

// In-memory session support, required by passport.session()
app.use(session({
  secret: 'ilovethenodejs',
  resave: true,
  saveUninitialized: true
}))

// Use the passport middleware to enable passport
app.use(passport.initialize())

// Enable passport persistent sessions
app.use(passport.session())
app.use(flash())

// Configure passport strategies & routes
passportMiddleware(app)
routes(app)

// connect to database
mongoose.connect('mongodb://127.0.0.1:27017/authenticator')
// start server
app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))
