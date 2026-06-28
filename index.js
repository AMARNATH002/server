require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');


const authRoutes     = require('./routes/authRoutes');
const foodRoutes     = require('./routes/foodRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const profileRoutes  = require('./routes/profileRoutes');
const shopRoutes     = require('./routes/shopRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const contactRoutes  = require('./routes/contactRoutes');

const app = express();


const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  /\.vercel\.app$/,  
];


if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());


app.use('/images', express.static('public/images'));


app.use('/api',            authRoutes);      // POST /api/register  POST /api/login
app.use('/api/foods',      foodRoutes);      // GET  /api/foods  POST /api/foods/:id/rate
app.use('/api/categories', categoryRoutes);  // GET /api/categories  POST/DELETE /api/categories/:id (admin)
app.use('/api/orders',     orderRoutes);     // GET/POST /api/orders  PUT /api/orders/:id/cancel
app.use('/api/profile',    profileRoutes);   // GET/PUT /api/profile  PUT /api/profile/address
app.use('/api/shop',       shopRoutes);      // /api/shop/me  /api/shop/foods  /api/shop/orders
app.use('/api/admin',      adminRoutes);     // /api/admin/users  /api/admin/foods
app.use('/api',            contactRoutes);   // GET/PUT /api/contact-info  POST /api/contact

const feedbackRouter = require('express').Router();
feedbackRouter.post('/', require('./middleware/auth').authenticateToken, require('./controllers/shopController').submitFeedback);
app.use('/api/feedback', feedbackRouter);


const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
