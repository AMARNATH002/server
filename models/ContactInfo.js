const mongoose = require('mongoose');


const contactInfoSchema = new mongoose.Schema({
  email:   { type: String, default: 'info@foodorder.com' },
  phone:   { type: String, default: '+91 98765 43210' },
  address: { type: String, default: '123 Food Street, Chennai, Tamil Nadu' },
});

module.exports = mongoose.model('ContactInfo', contactInfoSchema);
