const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getCategories, addCategory, deleteCategory } = require('../controllers/foodController');

// GET  /api/categories          — public, used by frontend voice assistant
router.get('/', getCategories);

// POST /api/categories          — admin only, add new voice command category
router.post('/', authenticateToken, requireAdmin, addCategory);

// DELETE /api/categories/:id    — admin only
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

module.exports = router;
