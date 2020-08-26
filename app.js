require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const formidableMiddleware = require('express-formidable')
const mongoose = require('mongoose')

mongoose.connect(process.env.CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
const User = require('./models/user')

const session = require('express-session')
const passportSession = require('passport-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const sha256 = require('sha256')

const app = express()

app.use(formidableMiddleware())

app.use((req, res, next) => {
  req.body = req.fields
  next()
})

app.use(cookieParser())
app.use(express.static('public'))

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (username, password, done) {
    const passwordHash = sha256(password);
    User.findOne({ email: username }, function (err, user) {
      if (err) {
        return done(err)
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username." })
      }
      if (user.password != passwordHash) {
        return done(null, false, { message: "Incorrect password." })
      }
      return done(null, user)
    })
  })
)

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  done(null, user)
})

app.post('/auth/login', passport.authenticate(
  'local', {
  successRedirect: "/",
  failureRedirect: "/auth/login",
})
)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

const indexRouter = require('./routes/index')
const authRouter = require('./routes/auth')
const profileRouter = require('./routes/profile')
const importExportRouter = require('./routes/import_export')

app.use('/', indexRouter)
app.use('/auth', authRouter)
app.use('/profile', profileRouter)
app.use('/import', importExportRouter)


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app