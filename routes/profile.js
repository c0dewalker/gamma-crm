const express = require("express")
const User = require("../models/user")
const isAuth = require('../middleware/authMiddleware')
const router = express.Router()

router.get("/:id", isAuth(), async function (req, res, next) {
  const currentUser = await User.findById(req.params.id)
  if (currentUser.status == 1) {
    res.render("profile/manager", currentUser)
  } else {
    res.render("profile/admin", currentUser)
  }

})

module.exports = router