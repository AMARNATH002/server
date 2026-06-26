const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    price:    { type: Number, required: true },
    category: { type: String, required: true },
    image:    { type: String, required: true },
    shopId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodItem', foodItemSchema);
