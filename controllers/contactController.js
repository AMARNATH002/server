const ContactInfo = require('../models/ContactInfo');


const getContactInfo = async (req, res) => {
  try {
    let info = await ContactInfo.findOne();
    if (!info) info = await ContactInfo.create({});
    res.json(info);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateContactInfo = async (req, res) => {
  try {
    const { email, phone, address } = req.body;
    let info = await ContactInfo.findOne();
    if (!info) info = new ContactInfo({});

    if (email)   info.email   = email;
    if (phone)   info.phone   = phone;
    if (address) info.address = address;

    await info.save();
    res.json({ message: 'Contact info updated', info });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


const submitContactForm = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  res.json({ message: 'Message received! We will get back to you soon.' });
};

module.exports = { getContactInfo, updateContactInfo, submitContactForm };
