module.exports = function authenticationMiddleware() {
  return function (req, res, next) {
    if (req.isAuthenticated() && req.session.passport.user.status === 2) {
      return next()
    }
    res.redirect('/auth/login')
  }
}
