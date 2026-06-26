const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../utils/upload');
const { getAllUsers, deleteUser, addFood, updateFood, deleteFood } = require('../controllers/adminController');


router.get('/users',       authenticateToken, requireAdmin, getAllUsers);
router.delete('/users/:id',authenticateToken, requireAdmin, deleteUser);


router.post('/foods',       authenticateToken, requireAdmin, upload.single('image'), addFood);
router.put('/foods/:id',    authenticateToken, requireAdmin, upload.single('image'), updateFood);
router.delete('/foods/:id', authenticateToken, requireAdmin, deleteFood);

module.exports = router;
