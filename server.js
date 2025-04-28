const express = require('express');
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/cards');
const suggestionRoutes = require('./routes/suggestions');

dotenv.config();

const app = express();
app.use(express.json());

// Set up the rate limiter: 20 requests per IP per 1 minutes
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute in milliseconds
  max: 20,
  message: 'Too many requests, please try again later.',
  standardHeaders: true, 
  legacyHeaders: false, 
});

app.use(limiter);

// Add a test route to verify server is running
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.send('Server is up and running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
  });

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/suggestions', suggestionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
