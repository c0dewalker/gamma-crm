const express = require('express')
const router = express.Router()
const Contact = require('../models/contact')
const XLSX = require('xlsx')
const excel = require('exceljs')
const fs = require('fs')
const path = require('path')
const isAuth = require('../middleware/authMiddleware')
const isAdmin = require('../middleware/isAdmin')

const mainDir = __dirname.slice(0, __dirname.lastIndexOf('/'))

router.post('/', isAuth(), (req, res) => {
  const dir = path.join(mainDir, "public/files/import")
  try { fs.mkdirSync(dir) } catch (e) { }

  const f = req.files[Object.keys(req.files)[0]]
  const newpath = path.join(dir, f.name)
  fs.renameSync(f.path, newpath)
  console.log("moved " + f.path + " to " + newpath)
  const workbook = XLSX.readFile(newpath)
  var first_sheet_name = workbook.SheetNames[0]
  var worksheet = workbook.Sheets[first_sheet_name]
  const xlJSON = XLSX.utils.sheet_to_json(worksheet)

  async function importFromExcel() {
    const l = xlJSON.length
    for (let i = 0; i < l; i++) {
      const oldContact = await Contact.findOne({ name: xlJSON[i]['name'] })
      if (!oldContact) {
        let status = 1
        if (xlJSON[i]['result']) status = 8
        const newContact = new Contact({
          date: new Date((xlJSON[i]['date'] - (25567 + 2)) * 86400 * 1000),
          name: xlJSON[i]['name'],
          phone: xlJSON[i]['phone'],
          email: xlJSON[i]['email'],
          comments: xlJSON[i]['comments'],
          source: xlJSON[i]['source'],
          service: xlJSON[i]['service'],
          result: xlJSON[i]['result'],
          status: status
        })
        newContact.save()
      }
    }
  }
  importFromExcel()
  res.redirect('/')
})


router.get('/', isAdmin(), async (req, res) => {
  let allContacts = await Contact.find().lean()
  const status = ['', 'неразобранное', 'первичный контакт', 'назначена встреча', 'встреча не состоялась', 'переговоры', 'принимают решение', 'соглосование договора', 'завершенные']
  allContacts.forEach(item => item.status = status[item.status])
  const workbook = new excel.Workbook() //creating workbook
  let worksheet = workbook.addWorksheet('экспортированые Контакты') //creating worksheet

  //  WorkSheet Header
  worksheet.columns = [
    { header: 'Дата', key: 'date', width: 10 },
    { header: 'Имя', key: 'name', width: 30 },
    { header: 'Телефон', key: 'phone', width: 20 },
    { header: 'др. контакты', key: 'other', width: 30 },
    { header: 'Откуда', key: 'source', width: 30 },
    { header: 'Услуга', key: 'service', width: 30 },
    { header: 'Комментарии', key: 'comments', width: 30 },
    { header: 'Бюджет', key: 'budget', width: 15 },
    { header: 'Результат', key: 'result', width: 30 },
    { header: 'Ответственный', key: 'manager', width: 30 },
    { header: 'Статус', key: 'status', width: 30 },
  ]
  worksheet.addRows(allContacts)

  // Write to File
  const filename = path.join(mainDir, '/public/files/export/contacts_export.xlsx')
  await workbook.xlsx.writeFile(filename)
  res.redirect('./files/export/contacts_export.xlsx')
})

module.exports = router
