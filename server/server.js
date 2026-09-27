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

// Phase 2: Auth, Tenant, Project and Task routes
const authRoutes = require('./src/routes/auth.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const projectRoutes = require('./src/routes/project.routes');
const taskRoutes = require('./src/routes/task.routes');

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

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
