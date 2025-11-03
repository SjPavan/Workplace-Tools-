const express = require('express');
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const { authenticate, requireRole } = require('./middleware/auth');

const app = express();

app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);

app.get('/protected', authenticate, (_req, res) => {
  res.json({ message: 'Access granted' });
});

app.get('/admin/reports', authenticate, requireRole('admin'), (_req, res) => {
  res.json({ message: 'Admin content' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
