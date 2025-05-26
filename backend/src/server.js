// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (avatars) avec les bons headers CORS
app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads')));

// Routes d'authentification
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Routes des histoires
const storyRoutes = require('./routes/stories');
app.use('/api/stories', storyRoutes);

// Routes des chroniques
const chroniquesRoutes = require('./routes/chroniques.routes');
app.use('/api/chroniques', chroniquesRoutes);

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
  console.log(`📖 Routes disponibles:`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/profile`);
  console.log(`   - POST /api/auth/upload-avatar`);
  console.log(`   - GET  /api/stories`);
  console.log(`   - GET  /api/chroniques/drafts`);
  console.log(`   - GET  /api/chroniques/published`);
});