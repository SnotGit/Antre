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

// Routes publiques des histoires
const publicStoriesRoutes = require('./routes/publicStories.routes');
app.use('/api/public-stories', publicStoriesRoutes);
app.use('/api/users', publicStoriesRoutes);

// Routes privées des histoires
const privateStoriesRoutes = require('./routes/privateStories.routes');
app.use('/api/private-stories', privateStoriesRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'L\'Antre API fonctionne !', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 L'Antre API démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 Routes disponibles:`);
  console.log(`   🔐 AUTHENTIFICATION:`);
  console.log(`     - POST /api/auth/register`);
  console.log(`     - POST /api/auth/login`);
  console.log(`     - GET  /api/auth/profile`);
  console.log(`     - PUT  /api/auth/profile`);
  console.log(`     - POST /api/auth/upload-avatar`);
  console.log(`   🌍 PUBLIC (chroniques + user-profile):`);
  console.log(`     - GET  /api/public-stories`);
  console.log(`     - GET  /api/users/:id`);
  console.log(`   🔒 PRIVÉ (storyboard + CRUD):`);
  console.log(`     - GET  /api/private-stories/drafts`);
  console.log(`     - GET  /api/private-stories/published`);
  console.log(`     - GET  /api/private-stories/stats`);
  console.log(`     - POST /api/private-stories/draft`);
  console.log(`     - PUT  /api/private-stories/draft/:id`);
  console.log(`     - POST /api/private-stories/publish/:id`);
  console.log(`     - DELETE /api/private-stories/story/:id`);
});