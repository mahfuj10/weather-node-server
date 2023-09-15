// app.js
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require("dotenv").config();

const  { API_PORT, OPEN_WEATHER_API_KEY, OPEN_WEATHER_API_BASE, SECRET_KEY } = process.env

const PORT = API_PORT || 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    handler: rateLimitExceededHandler, // Custom error handler
    standardHeaders: 'draft-7', // Set `RateLimit` and `RateLimit-Policy` headers
	legacyHeaders: false, 
});

app.use('/weather/:city', limiter);

// Login endpoint to generate JWT
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'user' && password === 'password') {
    const token = jwt.sign({ username }, SECRET_KEY);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Authentication failed' });
  }
});


app.get('/weather/:city', verifyToken, async (req, res) => {
  const { city } = req.params;
  try {
    const weatherData = await fetchWeatherData(city);
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});


// Verify JWT middleware
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    jwt.verify(bearerToken, SECRET_KEY, (err, authData) => {
      if (err) {
        res.status(401).json({ message: 'Unauthorized' });
      } else {
        req.authData = authData;
        next();
      }
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

async function fetchWeatherData(city) {
  const url = `${OPEN_WEATHER_API_BASE}weather?q=${city}&appid=${OPEN_WEATHER_API_KEY}&units=metric`;
  const response = await axios.get(url);
  return response.data;
}

function rateLimitExceededHandler(req, res) {
    res.status(429).json({ error: "Time limit exceeded (max 3 request per minute). Please try again later." });
}

app.get("/",(req,res) => {
    res.send("Weather API ....")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 
