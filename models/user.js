const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  status: { type: Number, default: 1 },  // 1 - manager, 2 - admin
  date: Date
})

const User = mongoose.model('User', userSchema)

module.exports = User
