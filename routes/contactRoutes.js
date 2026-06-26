const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getContactInfo, updateContactInfo, submitContactForm } = require('../controllers/contactController');

router.get('/contact-info',  getContactInfo);
router.put('/contact-info',  authenticateToken, requireAdmin, updateContactInfo);
router.post('/contact',      submitContactForm);

module.exports = router;
