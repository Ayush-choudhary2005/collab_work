require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const errorMiddleware = require('./src/middleware/error.middleware');
const AppError = require('./src/utils/AppError');

const app = express();

app.use(cors());
app.use(express.json());

// Health check — confirms the server (and, once connected, the DB) is alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CollabFlow AI server is running.' });
});

// NOTE: Auth/Tenant/Project/Task routes are intentionally NOT mounted yet —
// that's Phase 2. This file only wires up the server, DB connection, and
// error handling so the middleware/models built in Phase 1 have somewhere
// to plug into next.

// 404 handler for anything unmatched
app.all('*', (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Centralized error handler — must be registered last
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] CollabFlow AI backend listening on port ${PORT}`);
  });
});

module.exports = app;
