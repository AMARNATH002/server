# Tomato Food App — Backend

A Node.js + Express REST API for the Tomato Restaurant Food Ordering App with JWT authentication, MongoDB Atlas, and Cloudinary image storage.

## Features

- User authentication with JWT (register / login)
- Multi-role system — Customer, Shop Owner, Admin
- Food item management with Cloudinary image upload
- Order placement and status tracking
- Shop owner dashboard — orders, sales reports, feedback
- Admin panel — manage users, foods, voice command categories
- Voice command category management
- Contact info management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- MongoDB Atlas account
- Cloudinary account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AMARNATH002/server.git
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (use `.env.example` as reference):

```bash
cp .env.example .env
```

4. Fill in your environment variables in `.env`

5. Start the development server:

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## Available Scripts

- `npm start` - Runs the server in production mode
- `npm run dev` - Runs the server with nodemon (auto-restart)

## Technologies Used

- Node.js
- Express.js
- MongoDB Atlas + Mongoose
- JWT (jsonwebtoken)
- bcrypt
- Multer + Cloudinary
- dotenv
- CORS

## Environment Variables

See `.env.example` for all required variables:

```
MONGODB_URI=
JWT_SECRET=
PORT=5000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
FRONTEND_URL=
```

## Project Structure

```
server/
├── config/
│   └── db.js               # MongoDB connection + admin seed
├── controllers/
│   ├── authController.js
│   ├── foodController.js
│   ├── orderController.js
│   ├── profileController.js
│   ├── shopController.js
│   ├── adminController.js
│   └── contactController.js
├── middleware/
│   └── auth.js             # JWT verification + role check
├── models/
│   ├── User.js
│   ├── FoodItem.js
│   ├── Order.js
│   ├── FoodRating.js
│   ├── FoodCategory.js
│   ├── Feedback.js
│   └── ContactInfo.js
├── routes/
│   ├── authRoutes.js
│   ├── foodRoutes.js
│   ├── categoryRoutes.js
│   ├── orderRoutes.js
│   ├── profileRoutes.js
│   ├── shopRoutes.js
│   ├── adminRoutes.js
│   └── contactRoutes.js
├── utils/
│   └── upload.js           # Multer + Cloudinary storage config
├── .env.example
├── index.js                # App setup + route wiring
└── server.js               # Entry point
```

## API Base URL

**Production:** `https://backend-8j7e.onrender.com`  
**Local:** `http://localhost:5000`

## Deployment

Deployed on **Render** — auto-deploys on every push to `main` branch.

Set all environment variables in the Render dashboard under the Environment tab.

## Related

- Frontend Repo: [AMARNATH002/client](https://github.com/AMARNATH002/client)
- Live App: [rapidmeal.vercel.app](https://rapidmeal.vercel.app)

## Author

**Amarnath** — [GitHub @AMARNATH002](https://github.com/AMARNATH002)
