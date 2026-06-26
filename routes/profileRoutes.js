const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProfile, updateProfile, updateAddress } = require('../controllers/profileController');

router.get('/',         authenticateToken, getProfile);
router.put('/',         authenticateToken, updateProfile);
router.put('/address',  authenticateToken, updateAddress);

module.exports = router;
