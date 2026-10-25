// server.js — entry point
// Flow: request → routes → controllers → models → MySQL

require('dotenv').config();

const express = require('express');
const path = require('path');
const taskRoutes = require('./src/routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the frontend (HTML, CSS, JS) from /public
app.use(express.static(path.join(__dirname, 'public')));

// Health check moved to /api so that GET / serves the frontend
app.get('/api', (req, res) => {
  res.json({ message: 'Task API is ready!', version: 'MySQL + MVC' });
});

app.use('/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Frontend:  GET /');
  console.log('Health:    GET /api');
  console.log('GET    /tasks');
  console.log('POST   /tasks');
  console.log('GET    /tasks/:id');
  console.log('PUT    /tasks/:id');
  console.log('PATCH  /tasks/:id');
  console.log('DELETE /tasks/:id');
});