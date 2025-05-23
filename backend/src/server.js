// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes d'authentification
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Routes des histoires
const storyRoutes = require('./routes/stories');
app.use('/api/stories', storyRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'L\'Antre API fonctionne !', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 L'Antre API démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});