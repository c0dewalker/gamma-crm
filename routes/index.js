const express = require('express')
const Contact = require('../models/contact')
const router = express.Router()
const isAuth = require('../middleware/authMiddleware')

// home page
router.get('/', isAuth(), async function (req, res, next) {
  const currentName = req.session.passport.user.name
  const currentId = req.session.passport.user._id

  const allContacts = await Contact.find({ visible: true }).sort({ date: -1 }).lean()

  let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }

  const options = {
    sortedContacts: [[], [], [], [], [], [], [], [], []],
    sums: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    counts: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  }

  allContacts.forEach(contact => {
    contact.date = Intl.DateTimeFormat('en-GB', dateOptions).format(contact.date)

    options.counts[contact.status] += 1
    if (contact.budget) options.sums[contact.status] += contact.budget
    options.sortedContacts[contact.status].push(contact)
    
    })
  options.sum = options.sums.reduce((sum, item) => sum + item)
  options.num = options.counts.reduce((num, item) => num + item)

  res.render('index', { name: currentName, id: currentId, options })
})

// открывает окно контакта + edit
router.get('/edit/:id', isAuth(), async (req, res, next) => {
  let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  const contact = await Contact.findById(req.params.id).lean()
  contact.date = Intl.DateTimeFormat('en-GB', dateOptions).format(contact.date)
  const newStatus = contact.status.toString()
  if (newStatus == 1) {
    return res.render('edit', { contact, someStatus: 'неразобранное' })
  }
  else if (newStatus == 2) {
    return res.render('edit', { contact, someStatus: 'первичный контакт' })
  }
  else if (newStatus == 3) {
    return res.render('edit', { contact, someStatus: 'назначена встреча' })
  }
  else if (newStatus == 4) {
    return res.render('edit', { contact, someStatus: 'встреча не состоялась' })
  }
  else if (newStatus == 5) {
    return res.render('edit', { contact, someStatus: 'переговоры' })
  }
  else if (newStatus == 6) {
    return res.render('edit', { contact, someStatus: 'принимают решение' })
  }
  else if (newStatus == 7) {
    return res.render('edit', { contact, someStatus: 'согласование договора' })
  }
  else if (newStatus == 8) {
    return res.render('edit', { contact, someStatus: 'завершенные' })
  }
})

router.get('/delete/:id', async function (req, res, next) {
  console.log('hello!')
  const currentContact = await Contact.findOne({'_id': req.params.id})
  currentContact.visible = false
  await currentContact.save()
  res.redirect('/')
})

// изменяет поля контакта и обновляет БД
router.post('/edit/:id', isAuth(), async (req, res, next) => {
  const contact = await Contact.findById(req.params.id)
  let { name, status, manager, budget, email, phone, other, service, comments, result, date, source } = req.body
  if (status == 'неразобранное') {
    status = 1
  }
  else if (status == 'первичный контакт') {
    status = 2
  }
  else if (status == 'назначена встреча') {
    status = 3
  }
  else if (status == 'встреча не состоялась') {
    status = 4
  }
  else if (status == 'переговоры') {
    status = 5
  }
  else if (status == 'принимают решение') {
    status = 6
  }
  else if (status == 'согласование договора') {
    status = 7
  }
  else if (status == 'завершенные') {
    status = 8
  }
  contact.name = name
  contact.date = date
  contact.phone = phone
  contact.source = source
  contact.email = email
  contact.service = service
  contact.comments = comments
  contact.result = result
  contact.status = status
  contact.manager = manager
  contact.other = other
  contact.budget = budget

  contact.save()
  return res.redirect('/')
})

// new-contact
router.get('/new', isAuth(), function (req, res, next) {
  res.render('new')
})

// new-contact
router.post('/new', isAuth(), function (req, res, next) {
  let dateStr = req.body.date
  let date
  if (dateStr) {
    const arr = dateStr.split(".")
    const newStr = arr[1] + "." + arr[0] + "." + arr[2]
    date = new Date(newStr)
  } else {
    date = new Date()
  }
  
  const newContact = new Contact({
    name: req.body.name,
    date: date,
    phone: req.body.phone,
    source: req.body.source,
    email: req.body.email,
    service: req.body.service,
    comments: req.body.comments,
    result: req.body.result,
    other: req.body.other,
    status: req.body.status,
    budget: req.body.budget,
    manager: req.body.manager,
  })
  newContact.save()
  res.redirect('/')
})

router.get('/site', isAuth(), function (req, res, next) {
  res.render('site')
})

router.post('/site', function (req, res, next) {   // для обработки заявок с сайта

    const newContact = new Contact({
      name: req.body.name,
      phone: req.body.phone,
      date: new Date(),
      status: 1,
    })
    newContact.save()
    res.redirect('/')
})

router.post('/search', isAuth(), async function (req, res, next) {
  let dateFrom = req.body.dateFromSearch || '01.01.1900'
  let dateTo = req.body.dateToSearch
  const arr = dateFrom.split('.')
  const arr1 = dateTo.split('.')
  const dateFrom1 = arr[1] + '.' + arr[0] + '.' + arr[2]
  const newFrom = new Date(dateFrom1)
  if (dateTo) {
    const dateTo1 = arr1[1] + '.' + arr1[0] + '.' + arr1[2]
    var newTo = new Date(dateTo1)
  }
  else {
    var newTo = new Date()
  }
  let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  const filtered = await Contact.find({

    visible: true,
    $or: [
      { name: { $regex: req.body.nameSearch, $options: "gmi" } },
      { manager: { $regex: req.body.nameSearch, $options: "gmi" } },
    ],
    date: { $gte: newFrom, $lte: newTo },
  }).lean()
    .sort({ date: -1 })
    .then((data) => {
      const currentName = req.session.passport.user.name
      const currentId = req.session.passport.user._id
      const allContacts = data
      const options = {
      sortedContacts: [[], [], [], [], [], [], [], [], []],
      sums: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      counts: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
      allContacts.forEach(contact => {
      contact.date = Intl.DateTimeFormat('en-GB', dateOptions).format(contact.date)
      options.counts[contact.status] += 1
      if (contact.budget) options.sums[contact.status] += contact.budget
      options.sortedContacts[contact.status].push(contact)
  })
  options.sum = options.sums.reduce((sum, item) => sum + item)
  options.num = options.counts.reduce((num, item) => num + item)

  res.render('index', { name: currentName, id: currentId, options })
      })
    })


module.exports = router
