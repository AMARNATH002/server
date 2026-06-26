const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllFoods,
  rateFood,
  getCategories,
  addCategory,
  deleteCategory,
} = require('../controllers/foodController');


router.get('/', getAllFoods);


router.post('/:id/rate', authenticateToken, rateFood);

module.exports = router;
