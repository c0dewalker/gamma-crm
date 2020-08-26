const express = require("express")
const User = require("../models/user")
const sha256 = require("sha256")
const isAuth = require('../middleware/authMiddleware')
const isAdmin = require('../middleware/isAdmin')
const router = express.Router()

router.get("/signup", function (req, res, next) {
  res.render("auth/signup")
})

router.post("/signup", async function (req, res, next) {
  try {
    const { name, email, password, status } = req.body
    res.locals.password = password
    const passwordHash = sha256(password)
    const getNewUser = await User.findOne({ email: email })
    if (getNewUser) {
      return res.status(400).json({ message: "Такой пользователь уже существует" })
    }
    const newUser = new User({ name, email, password: passwordHash, status })
    await newUser.save()
    res.render("auth/created", { email: newUser.email, password: password })
  } catch (error) {
    res.status(500).json({ message: "Что-то пошло не так" })
  }
})

router.get("/login", function (req, res, next) {
  res.render("auth/login")
})

router.get("/logout", isAuth(), function (req, res, next) {
  req.session.destroy()
  res.redirect("login")
})

router.get("/newManager", isAdmin(), function (req, res, next) {
  res.render("auth/newManager")
})

router.get("/passChange", isAuth(), function (req, res, next) {
  res.render("auth/passChange")
})

router.post("/reset", isAuth(), async function (req, res, next) {
  // в req.body поступают данные из формы
  try {
    const { email, password, newPass } = req.body
    const passwordHash = sha256(password)
    const newHash = sha256(newPass)
    const loggedUser = await User.findOne({ email })
    if (loggedUser.password === passwordHash) {
      loggedUser.password = newHash
      await loggedUser.save()
      res.render("auth/changed")
    }
  }
  catch (error) {
    res.status(500).json({ message: "Что-то пошло не так" })
  }
})

module.exports = router
