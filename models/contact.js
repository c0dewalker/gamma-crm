const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
  name: String,
  date: Date,
  phone: String,
  source: String,
  email: String,
  service: String,
  comments: String,
  result: String,
  other: String,
  status: Number,
  budget: Number,
  manager: String,
  visible: {
    type: Boolean,
    default: true
  }
})

const Contact = mongoose.model('Contact', contactSchema)

module.exports = Contact
