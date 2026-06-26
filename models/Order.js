const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        foodId:      { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
        name:        { type: String, required: true },
        price:       { type: Number, required: true },
        quantity:    { type: Number, required: true },
        image:       { type: String, required: true },
        shopId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        shopName:    { type: String },
        shopPhone:   { type: String },
        shopAddress: { type: String },
      },
    ],
    totalAmount:     { type: Number, required: true },
    status:          {
      type: String,
      default: 'pending',
      enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'],
    },
    deliveryAddress: { type: String, required: true },
    phone:           { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
