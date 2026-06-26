const mongoose = require('mongoose');


const foodRatingSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);


foodRatingSchema.index({ foodId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('FoodRating', foodRatingSchema);
